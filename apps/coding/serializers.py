from rest_framework import serializers
from rest_framework.exceptions import NotFound
from django.db import transaction

from apps.evaluations.models import AttemptStatus, TestAttempt
from apps.tests.models import Test

from .models import CodingQuestion, CodingSubmission, CodingTestCase
from .utils import normalize_output, sha256_hex


ALLOWED_LANGUAGES = ('python', 'javascript')
MAX_CASE_TEXT_LENGTH = 10000
MAX_CODE_LENGTH = 100000


class TeacherCodingTestCaseSerializer(serializers.ModelSerializer):
    input = serializers.CharField(source='input_data', max_length=MAX_CASE_TEXT_LENGTH, required=False, allow_blank=True)
    expected_output = serializers.CharField(max_length=MAX_CASE_TEXT_LENGTH, allow_blank=True)

    class Meta:
        model = CodingTestCase
        fields = ('id', 'input', 'expected_output', 'is_hidden', 'marks')
        read_only_fields = ('id',)

    def validate_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError('Case marks must be greater than zero.')
        return value


class TeacherCodingQuestionSerializer(serializers.ModelSerializer):
    test_id = serializers.IntegerField(required=False)
    test_cases = TeacherCodingTestCaseSerializer(many=True, required=False)

    class Meta:
        model = CodingQuestion
        fields = (
            'id', 'test_id', 'title', 'statement', 'constraints', 'starter_code',
            'allowed_languages', 'max_marks', 'is_published', 'order', 'test_cases',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_test_id(self, value):
        user = self.context['request'].user
        if not Test.objects.filter(pk=value, created_by=user).exists():
            raise serializers.ValidationError('The test must be owned by you.')
        return value

    def validate_allowed_languages(self, value):
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('Select at least one allowed language.')
        if any(not isinstance(language, str) or language not in ALLOWED_LANGUAGES for language in value):
            raise serializers.ValidationError('Languages must be unique values from python and javascript.')
        if len(value) != len(set(value)):
            raise serializers.ValidationError('Languages must be unique values from python and javascript.')
        return value

    def validate_starter_code(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('starter_code must be an object keyed by language.')
        if any(language not in ALLOWED_LANGUAGES for language in value):
            raise serializers.ValidationError('Starter code keys must be python or javascript.')
        if any(not isinstance(code, str) or len(code) > MAX_CODE_LENGTH for code in value.values()):
            raise serializers.ValidationError('Each starter code value must be text of at most 100000 characters.')
        return value

    def validate_max_marks(self, value):
        if value <= 0:
            raise serializers.ValidationError('max_marks must be greater than zero.')
        return value

    def validate(self, attrs):
        replacing_cases = 'test_cases' in attrs
        if self.instance is not None and 'test_id' in attrs:
            raise serializers.ValidationError({'test_id': 'A coding question cannot be moved to another test.'})
        if self.instance is None:
            if 'test_id' not in attrs:
                raise serializers.ValidationError({'test_id': 'This field is required.'})
            if not replacing_cases:
                raise serializers.ValidationError({'test_cases': 'At least one visible and one hidden case are required.'})

        cases = attrs.get('test_cases')
        if replacing_cases:
            if len(cases) > 50:
                raise serializers.ValidationError({'test_cases': 'A coding question can have at most 50 test cases.'})
            if not cases:
                raise serializers.ValidationError({'test_cases': 'At least one visible and one hidden case are required.'})
            if not any(not case['is_hidden'] for case in cases) or not any(case['is_hidden'] for case in cases):
                raise serializers.ValidationError({'test_cases': 'Include at least one visible and one hidden case.'})

        effective_languages = attrs.get('allowed_languages', getattr(self.instance, 'allowed_languages', None))
        effective_starter = attrs.get('starter_code', getattr(self.instance, 'starter_code', {}))
        if effective_languages is not None and any(lang not in effective_languages for lang in effective_starter):
            raise serializers.ValidationError({'starter_code': 'Starter code can only be supplied for allowed languages.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        test_id = validated_data.pop('test_id')
        cases_data = validated_data.pop('test_cases')
        question = CodingQuestion.objects.create(
            test_id=test_id,
            owner=self.context['request'].user,
            **validated_data,
        )
        self._create_cases(question, cases_data)
        return question

    @transaction.atomic
    def update(self, instance, validated_data):
        cases_data = validated_data.pop('test_cases', None)
        test_id = validated_data.pop('test_id', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if test_id is not None:
            instance.test_id = test_id
        instance.save()
        if cases_data is not None:
            instance.test_cases.all().delete()
            self._create_cases(instance, cases_data)
        return instance

    @staticmethod
    def _create_cases(question, cases_data):
        CodingTestCase.objects.bulk_create([
            CodingTestCase(question=question, order=index, **case)
            for index, case in enumerate(cases_data)
        ])


class StudentVisibleCaseSerializer(serializers.ModelSerializer):
    input = serializers.CharField(source='input_data', read_only=True)

    class Meta:
        model = CodingTestCase
        fields = ('id', 'input', 'expected_output', 'is_hidden', 'marks')


class StudentCodingQuestionSerializer(serializers.ModelSerializer):
    test_id = serializers.IntegerField(read_only=True)
    test_cases = serializers.SerializerMethodField()

    class Meta:
        model = CodingQuestion
        fields = (
            'id', 'test_id', 'title', 'statement', 'constraints', 'starter_code',
            'allowed_languages', 'max_marks', 'test_cases',
        )

    def get_test_cases(self, obj):
        visible = obj.test_cases.filter(is_hidden=False).order_by('order', 'id')
        return StudentVisibleCaseSerializer(visible, many=True).data


class GradingCaseSerializer(serializers.ModelSerializer):
    input = serializers.CharField(source='input_data', read_only=True)

    class Meta:
        model = CodingTestCase
        fields = ('id', 'input', 'is_hidden')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_hidden:
            data['expected_hash'] = sha256_hex(normalize_output(instance.expected_output))
        else:
            data['expected_output'] = instance.expected_output
        return data


class CodingTestQuestionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingQuestion
        fields = ('id', 'title', 'max_marks', 'order')


class CodingSubmissionInputSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=ALLOWED_LANGUAGES)
    source_code = serializers.CharField(max_length=MAX_CODE_LENGTH, trim_whitespace=False)


class CodingCaseResultInputSerializer(serializers.Serializer):
    case_id = serializers.IntegerField()
    passed = serializers.BooleanField()
    status = serializers.ChoiceField(choices=('ok', 'wrong', 'runtime_error', 'timeout'))


class CodingSubmissionCreateSerializer(CodingSubmissionInputSerializer):
    question_id = serializers.IntegerField()
    attempt_id = serializers.IntegerField()
    case_results = CodingCaseResultInputSerializer(many=True)

    def validate(self, attrs):
        request = self.context['request']
        student = request.user
        question = CodingQuestion.objects.filter(
            pk=attrs['question_id'],
            is_published=True,
            test__is_published=True,
        ).select_related('test').first()
        if not question:
            raise serializers.ValidationError({'question_id': 'Question or test is not published.'})
        if attrs['language'] not in question.allowed_languages:
            raise serializers.ValidationError({'language': 'This language is not allowed for the question.'})

        attempt = TestAttempt.objects.filter(pk=attrs['attempt_id'], student=student).select_related(
            'test', 'test__created_by'
        ).first()
        if not attempt:
            raise serializers.ValidationError({'attempt_id': 'Invalid attempt_id.'})
        if attempt.status not in (AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED):
            raise serializers.ValidationError({'attempt_id': 'Attempt is not active.'})
        if attempt.test_id != question.test_id:
            raise serializers.ValidationError({'attempt_id': 'This question is not part of the attempt test.'})
        if not student.assigned_teachers.filter(pk=attempt.test.created_by_id).exists():
            raise serializers.ValidationError({'attempt_id': 'This test is not assigned to you.'})

        if attempt.test.duration_minutes:
            from datetime import timedelta
            from django.utils import timezone
            deadline = attempt.started_at + timedelta(minutes=attempt.test.duration_minutes, seconds=30)
            if timezone.now() > deadline:
                raise serializers.ValidationError({'attempt_id': 'Attempt has expired.'})

        cases = list(question.test_cases.all().order_by('order', 'id'))
        results = attrs['case_results']
        case_ids = [result['case_id'] for result in results]
        expected_ids = {case.id for case in cases}
        if len(case_ids) != len(set(case_ids)):
            raise serializers.ValidationError({'case_results': 'Duplicate case_id values are not allowed.'})
        if set(case_ids) != expected_ids:
            raise serializers.ValidationError({'case_results': 'Provide exactly one result for every question case.'})
        for result in results:
            if result['passed'] and result['status'] != 'ok':
                raise serializers.ValidationError(
                    {'case_results': 'A passed case must have status "ok".'}
                )

        result_by_id = {result['case_id']: result for result in results}
        ordered_results = [
            {'case_id': case.id, **result_by_id[case.id]}
            for case in cases
        ]
        passed = sum(result['passed'] for result in ordered_results)
        if passed == len(cases):
            overall_status = CodingSubmission.Status.ACCEPTED
        elif passed:
            overall_status = CodingSubmission.Status.PARTIAL
        elif any(result['status'] == 'timeout' for result in ordered_results):
            overall_status = CodingSubmission.Status.TIMEOUT
        elif any(result['status'] == 'runtime_error' for result in ordered_results):
            overall_status = CodingSubmission.Status.RUNTIME_ERROR
        else:
            overall_status = CodingSubmission.Status.WRONG

        all_case_marks = sum(case.marks for case in cases)
        if not all_case_marks:
            raise serializers.ValidationError({'case_results': 'Question test cases must have positive total weight.'})
        passed_marks = sum(
            case.marks for case in cases if result_by_id[case.id]['passed']
        )
        attrs.update({
            'question': question,
            'attempt': attempt,
            'ordered_case_results': ordered_results,
            'passed_count': passed,
            'total_count': len(cases),
            'overall_status': overall_status,
            'max_score': float(question.max_marks),
            'score': question.max_marks * passed_marks / all_case_marks,
        })
        return attrs

    def create(self, validated_data):
        validated_data.pop('question_id')
        validated_data.pop('attempt_id')
        validated_data.pop('case_results')
        question = validated_data.pop('question')
        attempt = validated_data.pop('attempt')
        case_results = validated_data.pop('ordered_case_results')
        passed_count = validated_data.pop('passed_count')
        total_count = validated_data.pop('total_count')
        overall_status = validated_data.pop('overall_status')
        score = validated_data.pop('score')
        max_score = validated_data.pop('max_score')
        return CodingSubmission.objects.create(
            student=self.context['request'].user,
            question=question,
            attempt=attempt,
            case_results=case_results,
            passed_count=passed_count,
            total_count=total_count,
            status=overall_status,
            score=score,
            max_score=max_score,
            graded_by='browser',
            **validated_data,
        )


class CodingSubmissionResponseSerializer(serializers.ModelSerializer):
    passed = serializers.IntegerField(source='passed_count', read_only=True)
    total = serializers.IntegerField(source='total_count', read_only=True)
    cases = serializers.SerializerMethodField()

    class Meta:
        model = CodingSubmission
        fields = ('status', 'score', 'max_score', 'passed', 'total', 'cases')

    def get_cases(self, obj):
        return [
            {'index': index, 'passed': case_result['passed']}
            for index, case_result in enumerate(obj.case_results)
        ]


class AttemptSubmissionsQuerySerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()

    def validate_attempt_id(self, value):
        attempt = TestAttempt.objects.filter(
            pk=value,
            student=self.context['request'].user,
        ).first()
        if not attempt:
            raise NotFound('Attempt not found.')
        self.context['attempt'] = attempt
        return value


class StudentCodingSubmissionHistorySerializer(serializers.ModelSerializer):
    passed = serializers.IntegerField(source='passed_count', read_only=True)
    total = serializers.IntegerField(source='total_count', read_only=True)
    cases = serializers.SerializerMethodField()

    class Meta:
        model = CodingSubmission
        fields = (
            'question_id', 'status', 'score', 'max_score', 'passed', 'total',
            'cases', 'language', 'source_code', 'created_at',
        )

    def get_cases(self, obj):
        return [
            {'index': index, 'passed': case_result['passed']}
            for index, case_result in enumerate(obj.case_results)
        ]


class SubmissionStudentSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)


class TeacherCodingQuestionSubmissionSerializer(serializers.ModelSerializer):
    student = SubmissionStudentSerializer(read_only=True)
    attempt_id = serializers.IntegerField(read_only=True)
    passed = serializers.IntegerField(source='passed_count', read_only=True)
    total = serializers.IntegerField(source='total_count', read_only=True)
    cases = serializers.SerializerMethodField()

    class Meta:
        model = CodingSubmission
        fields = (
            'id', 'student', 'attempt_id', 'status', 'score', 'max_score', 'passed',
            'total', 'cases', 'language', 'source_code', 'graded_by', 'created_at',
        )

    def get_cases(self, obj):
        return [
            {'index': index, 'passed': case_result['passed']}
            for index, case_result in enumerate(obj.case_results)
        ]


class GradingAttemptQuerySerializer(serializers.Serializer):
    attempt_id = serializers.IntegerField()

    def validate_attempt_id(self, value):
        request = self.context['request']
        attempt = TestAttempt.objects.filter(pk=value, student=request.user).select_related('test', 'test__created_by').first()
        if not attempt:
            raise serializers.ValidationError('Invalid attempt_id.')
        if attempt.status not in (AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED):
            raise serializers.ValidationError('Attempt is not active.')
        if not attempt.test.is_published or not request.user.assigned_teachers.filter(pk=attempt.test.created_by_id).exists():
            raise serializers.ValidationError('This test is not assigned to you.')
        if attempt.test.duration_minutes:
            from datetime import timedelta
            from django.utils import timezone
            deadline = attempt.started_at + timedelta(minutes=attempt.test.duration_minutes, seconds=30)
            if timezone.now() > deadline:
                raise serializers.ValidationError('Attempt has expired.')
        self.context['attempt'] = attempt
        return value
