from django.utils import timezone
from rest_framework import serializers

from apps.results.models import Result
from apps.tests.models import Option, Question, QuestionType, Test

from .models import AttemptStatus, Response, TestAttempt, TestViolation, ViolationType


class TestAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAttempt
        fields = ('id', 'test', 'student', 'status', 'started_at', 'submitted_at')
        read_only_fields = ('id', 'student', 'status', 'started_at', 'submitted_at')


class StartTestSerializer(serializers.Serializer):
    test_id = serializers.IntegerField()
    client_session_id = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate_test_id(self, value):
        student = self.context['request'].user
        test = Test.objects.filter(id=value).select_related('subject', 'created_by').first()
        if not test:
            raise serializers.ValidationError('Invalid test_id.')
        assigned_teachers = student.assigned_teachers.all()
        is_authorized = test.is_published and test.created_by in assigned_teachers
        if not is_authorized:
            raise serializers.ValidationError('You are not authorized to take this test.')
        return value

    def create(self, validated_data):
        student = self.context['request'].user
        test = Test.objects.get(id=validated_data['test_id'])
        client_session_id = (validated_data.get('client_session_id') or '').strip()

        attempt = TestAttempt.objects.filter(
            student=student,
            test=test,
            status__in=(AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED),
        ).order_by('-started_at').first()

        if attempt:
            if client_session_id and attempt.client_session_id and attempt.client_session_id != client_session_id:
                raise serializers.ValidationError(
                    {'client_session_id': 'Another active session already exists for this test.'}
                )
            if client_session_id and not attempt.client_session_id:
                attempt.client_session_id = client_session_id
                attempt.save(update_fields=['client_session_id'])
            return attempt

        return TestAttempt.objects.create(
            student=student,
            test=test,
            status=AttemptStatus.IN_PROGRESS,
            client_session_id=client_session_id,
        )


class SaveResponseSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)
    descriptive_text = serializers.CharField(required=False, allow_blank=True)
    client_session_id = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate(self, attrs):
        student = self.context['request'].user
        attempt = TestAttempt.objects.filter(id=attrs['attempt_id'], student=student).first()
        if not attempt:
            raise serializers.ValidationError('Invalid attempt_id.')
        if attempt.status not in (AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED):
            raise serializers.ValidationError('Attempt is not active.')
        client_session_id = (attrs.get('client_session_id') or '').strip()
        if client_session_id and attempt.client_session_id and attempt.client_session_id != client_session_id:
            raise serializers.ValidationError({'client_session_id': 'Active session mismatch.'})

        question = Question.objects.filter(id=attrs['question_id'], test=attempt.test).first()
        if not question:
            raise serializers.ValidationError('Invalid question_id for this attempt.')

        selected_option_id = attrs.get('selected_option_id', None)
        descriptive_text = attrs.get('descriptive_text', '')

        if question.question_type == QuestionType.MCQ:
            if selected_option_id is None:
                raise serializers.ValidationError('selected_option_id is required for MCQ.')
            option = Option.objects.filter(id=selected_option_id, question=question).first()
            if not option:
                raise serializers.ValidationError('Invalid selected_option_id for this question.')
        else:
            if 'descriptive_text' not in attrs:
                raise serializers.ValidationError('descriptive_text is required for descriptive questions.')

        attrs['attempt'] = attempt
        attrs['question'] = question
        return attrs

    def create(self, validated_data):
        attempt = validated_data['attempt']
        question = validated_data['question']

        response, _created = Response.objects.get_or_create(attempt=attempt, question=question)

        if question.question_type == QuestionType.MCQ:
            response.selected_option_id = validated_data.get('selected_option_id')
            response.descriptive_text = ''
        else:
            response.descriptive_text = validated_data.get('descriptive_text', '')
            response.selected_option = None

        response.save()
        return response


class ResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Response
        fields = ('id', 'attempt', 'question', 'selected_option', 'descriptive_text', 'saved_at')
        read_only_fields = ('id', 'saved_at')


class SubmitTestSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()

    def validate_attempt_id(self, value):
        student = self.context['request'].user
        attempt = TestAttempt.objects.filter(id=value, student=student).first()
        if not attempt:
            raise serializers.ValidationError('Invalid attempt_id.')
        if attempt.status in (AttemptStatus.SUBMITTED, AttemptStatus.TERMINATED):
            raise serializers.ValidationError('Attempt already submitted.')
        self.context['attempt'] = attempt
        return value

    def create(self, validated_data):
        attempt = self.context['attempt']
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=['status', 'submitted_at'])
        return attempt


class PendingEvaluationSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    pending_descriptive_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TestAttempt
        fields = (
            'id',
            'test',
            'test_title',
            'student',
            'student_username',
            'student_email',
            'student_name',
            'submitted_at',
            'pending_descriptive_count',
        )

    def get_student_name(self, obj):
        name = f'{obj.student.first_name} {obj.student.last_name}'.strip()
        return name or obj.student.username


class TeacherSubmissionSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True)
    subject_id = serializers.IntegerField(source='test.subject_id', read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='test.subject.name', read_only=True, default='')
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    max_score = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = TestAttempt
        fields = (
            'id',
            'test',
            'test_title',
            'subject_id',
            'subject_name',
            'student',
            'student_username',
            'student_email',
            'student_name',
            'status',
            'started_at',
            'submitted_at',
            'score',
            'max_score',
            'percentage',
            'answers',
        )

    def get_student_name(self, obj):
        name = f'{obj.student.first_name} {obj.student.last_name}'.strip()
        return name or obj.student.username

    def _result(self, obj):
        try:
            return obj.result
        except Result.DoesNotExist:
            return None

    def get_score(self, obj):
        result = self._result(obj)
        return result.score if result else None

    def get_max_score(self, obj):
        result = self._result(obj)
        return result.max_score if result else None

    def get_percentage(self, obj):
        result = self._result(obj)
        return result.percentage if result else None

    def get_answers(self, obj):
        responses = {r.question_id: r for r in obj.responses.select_related('selected_option', 'question').all()}
        details = []
        for question in obj.test.questions.all():
            resp = responses.get(question.id)
            details.append(
                {
                    'question_id': question.id,
                    'question_text': question.text,
                    'question_type': question.question_type,
                    'marks': question.marks,
                    'selected_option_id': resp.selected_option_id if resp else None,
                    'selected_option_text': resp.selected_option.text if resp and resp.selected_option else '',
                    'descriptive_text': resp.descriptive_text if resp else '',
                    'awarded_marks': resp.awarded_marks if resp else None,
                    'feedback': resp.feedback if resp else '',
                    'status': 'answered' if resp else 'unanswered',
                }
            )
        return details


class GradeDescriptiveAnswerSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()
    question_id = serializers.IntegerField()
    awarded_marks = serializers.FloatField()
    feedback = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        attempt = TestAttempt.objects.filter(id=attrs['attempt_id']).select_related('test').first()
        if not attempt:
            raise serializers.ValidationError('Invalid attempt_id.')
        if attempt.status != AttemptStatus.SUBMITTED:
            raise serializers.ValidationError('Attempt is not submitted.')

        grader = self.context['request'].user
        if (
            getattr(grader, 'role', '') in ('EVALUATOR', 'TEACHER')
            and (
                attempt.test.created_by_id != grader.id
                or not grader.assigned_students.filter(id=attempt.student_id).exists()
            )
        ):
            raise serializers.ValidationError('You can only grade assigned students for tests you created.')

        question = Question.objects.filter(id=attrs['question_id'], test=attempt.test).first()
        if not question:
            raise serializers.ValidationError('Invalid question_id for this attempt.')
        if question.question_type != QuestionType.DESCRIPTIVE:
            raise serializers.ValidationError('Only descriptive questions can be graded manually.')

        awarded_marks = attrs['awarded_marks']
        if awarded_marks < 0:
            raise serializers.ValidationError('awarded_marks must be non-negative.')
        if awarded_marks > question.marks:
            raise serializers.ValidationError('awarded_marks cannot exceed question marks.')

        attrs['attempt'] = attempt
        attrs['question'] = question
        return attrs


class LogViolationSerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()
    violation_type = serializers.ChoiceField(choices=ViolationType.choices)
    metadata = serializers.JSONField(required=False)
    client_session_id = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate(self, attrs):
        student = self.context['request'].user
        attempt = TestAttempt.objects.filter(id=attrs['attempt_id'], student=student).select_related('test').first()
        if not attempt:
            raise serializers.ValidationError('Invalid attempt_id.')
        if attempt.status not in (AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED):
            raise serializers.ValidationError('Attempt is not active.')

        client_session_id = (attrs.get('client_session_id') or '').strip()
        if client_session_id and attempt.client_session_id and attempt.client_session_id != client_session_id:
            raise serializers.ValidationError({'client_session_id': 'Active session mismatch.'})

        attrs['attempt'] = attempt
        return attrs

    def create(self, validated_data):
        attempt = validated_data['attempt']
        return TestViolation.objects.create(
            attempt=attempt,
            violation_type=validated_data['violation_type'],
            metadata=validated_data.get('metadata') or {},
        )
