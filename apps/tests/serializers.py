from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Option, Question, Subject, Test

User = get_user_model()


class TeacherSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name')

    def get_full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or obj.username


class SubjectSerializer(serializers.ModelSerializer):
    teachers = TeacherSummarySerializer(many=True, read_only=True)
    teacher_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(role='EVALUATOR'),
        source='teachers',
        required=False,
    )
    students_count = serializers.SerializerMethodField()
    teacher_names = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = (
            'id',
            'name',
            'code',
            'department',
            'description',
            'teachers',
            'teacher_ids',
            'students_count',
            'teacher_names',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_students_count(self, obj):
        return obj.students.count()

    def get_teacher_names(self, obj):
        names = []
        for t in obj.teachers.all():
            full_name = f'{t.first_name} {t.last_name}'.strip()
            names.append(full_name or t.username)
        return names


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ('id', 'text', 'is_correct', 'order')


class StudentOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ('id', 'text', 'order')


class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False, default=list)

    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'marks', 'model_answer', 'order', 'options')

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            qtype = data.get('question_type') or data.get('type') or ''
            if isinstance(qtype, str):
                if qtype.lower() in ('subjective', 'descriptive'):
                    data['question_type'] = 'DESCRIPTIVE'
                elif qtype.lower() in ('mcq', 'multiple_choice'):
                    data['question_type'] = 'MCQ'
        return super().to_internal_value(data)

    def validate(self, attrs):
        qtype = attrs.get('question_type') or (self.instance and self.instance.question_type) or 'MCQ'
        if qtype == 'MCQ':
            options = attrs.get('options', [])
            if not options and self.instance:
                options = list(self.instance.options.all().values('id', 'text', 'is_correct'))
            if not options or len(options) < 2:
                raise serializers.ValidationError({'options': 'MCQ questions must have at least 2 options.'})
            if not any(opt.get('is_correct') is True for opt in options):
                raise serializers.ValidationError({'options': 'Every MCQ question must have an explicitly selected correct option.'})
        return attrs


class StudentQuestionSerializer(serializers.ModelSerializer):
    options = StudentOptionSerializer(many=True, required=False, default=list)

    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'marks', 'order', 'options')


class TestSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False, default=list)
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        required=False,
        allow_null=True,
    )
    subject_id = serializers.IntegerField(source='subject.id', read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default='')
    subject_code = serializers.CharField(source='subject.code', read_only=True, default='')
    subject_department = serializers.CharField(source='subject.department', read_only=True, default='')
    created_by_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = (
            'id',
            'title',
            'description',
            'subject',
            'subject_id',
            'subject_name',
            'subject_code',
            'subject_department',
            'duration_minutes',
            'test_type',
            'scheduled_date',
            'scheduled_time',
            'is_published',
            'created_by',
            'created_by_name',
            'teacher_name',
            'created_at',
            'questions',
        )
        read_only_fields = ('id', 'created_by', 'created_at')

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if 'subject' not in data and 'subjectId' in data:
                data['subject'] = data['subjectId']
            elif 'subject' not in data and 'subject_id' in data:
                data['subject'] = data['subject_id']
            elif 'subject_code' in data and 'subject' not in data:
                subj = Subject.objects.filter(code=data['subject_code']).first()
                if subj:
                    data['subject'] = subj.id
            if 'duration' in data and 'duration_minutes' not in data:
                data['duration_minutes'] = data['duration']
            if 'type' in data and 'test_type' not in data:
                data['test_type'] = data['type']
            if 'scheduledAt' in data and 'scheduled_date' not in data:
                # If scheduledAt was passed as a combined date/string
                val = str(data['scheduledAt']).strip()
                if 'T' in val:
                    parts = val.split('T')
                    data['scheduled_date'] = parts[0]
                    if len(parts) > 1 and parts[1]:
                        data['scheduled_time'] = parts[1][:8]
        return super().to_internal_value(data)

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request and getattr(request, 'user', None) and request.user.is_authenticated else None
        subject = attrs.get('subject')

        if user and getattr(user, 'role', '') in ('EVALUATOR', 'TEACHER'):
            assigned_ids = set(user.teaching_subjects.values_list('id', flat=True))
            if subject is None:
                if len(assigned_ids) == 1:
                    attrs['subject'] = user.teaching_subjects.first()
                elif len(assigned_ids) > 1:
                    raise serializers.ValidationError(
                        {'subject': 'Select one of your assigned subjects for this test.'}
                    )
            elif assigned_ids and subject.id not in assigned_ids:
                raise serializers.ValidationError(
                    {'subject': 'Tests can only be created for a subject assigned to this teacher.'}
                )

        questions = attrs.get('questions', [])
        for idx, q in enumerate(questions, start=1):
            qtype = q.get('question_type') or 'MCQ'
            if qtype == 'MCQ':
                options = q.get('options', [])
                if not options or len(options) < 2:
                    raise serializers.ValidationError(
                        {'questions': f'Question {idx} (MCQ) must have at least 2 options.'}
                    )
                if not any(opt.get('is_correct') is True for opt in options):
                    raise serializers.ValidationError(
                        {'questions': f'Question {idx} (MCQ) must have an explicitly selected correct option.'}
                    )
        return attrs

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        full_name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
        return full_name or obj.created_by.username

    def get_teacher_name(self, obj):
        if obj.created_by:
            full_name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
            if full_name:
                return full_name
            if obj.created_by.username:
                return obj.created_by.username
        if obj.subject and obj.subject.teachers.exists():
            first_t = obj.subject.teachers.first()
            full_name = f'{first_t.first_name} {first_t.last_name}'.strip()
            return full_name or first_t.username
        return ''

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else validated_data.get('created_by')
        test = Test.objects.create(created_by=user, **validated_data)

        for index, question_data in enumerate(questions_data, start=1):
            options_data = question_data.pop('options', [])
            if 'order' not in question_data or question_data['order'] == 0:
                question_data['order'] = index
            question = Question.objects.create(test=test, **question_data)
            if question.question_type == 'MCQ':
                for opt_index, option_data in enumerate(options_data, start=1):
                    if 'order' not in option_data or option_data['order'] == 0:
                        option_data['order'] = opt_index
                    Option.objects.create(question=question, **option_data)

        return test

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            for index, question_data in enumerate(questions_data, start=1):
                options_data = question_data.pop('options', [])
                if 'order' not in question_data or question_data['order'] == 0:
                    question_data['order'] = index
                question = Question.objects.create(test=instance, **question_data)
                if question.question_type == 'MCQ':
                    for opt_index, option_data in enumerate(options_data, start=1):
                        if 'order' not in option_data or option_data['order'] == 0:
                            option_data['order'] = opt_index
                        Option.objects.create(question=question, **option_data)

        return instance


class StudentTestSerializer(serializers.ModelSerializer):
    questions = StudentQuestionSerializer(many=True)
    subject_id = serializers.IntegerField(source='subject.id', read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default='')
    subject_code = serializers.CharField(source='subject.code', read_only=True, default='')
    subject_department = serializers.CharField(source='subject.department', read_only=True, default='')
    created_by_name = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = (
            'id',
            'title',
            'description',
            'subject_id',
            'subject_name',
            'subject_code',
            'subject_department',
            'duration_minutes',
            'test_type',
            'scheduled_date',
            'scheduled_time',
            'is_published',
            'created_by_name',
            'teacher_name',
            'created_at',
            'questions',
        )

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ''
        full_name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
        return full_name or obj.created_by.username

    def get_teacher_name(self, obj):
        if obj.created_by:
            full_name = f'{obj.created_by.first_name} {obj.created_by.last_name}'.strip()
            if full_name:
                return full_name
            if obj.created_by.username:
                return obj.created_by.username
        if obj.subject and obj.subject.teachers.exists():
            first_t = obj.subject.teachers.first()
            full_name = f'{first_t.first_name} {first_t.last_name}'.strip()
            return full_name or first_t.username
        return ''
