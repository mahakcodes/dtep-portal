from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class SubjectMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    code = serializers.CharField(read_only=True)
    department = serializers.CharField(read_only=True)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    subject_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone_number', 'subject_ids')

    def validate_role(self, value):
        # Public registration cannot create faculty or admin accounts.
        if value in ('EVALUATOR', 'ADMIN', 'TEACHER'):
            raise serializers.ValidationError('This role cannot be self-registered.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        subject_ids = validated_data.pop('subject_ids', [])
        validated_data['role'] = validated_data.get('role') or 'STUDENT'
        user = User.objects.create_user(password=password, **validated_data)

        if subject_ids:
            from apps.tests.models import Subject
            subjects = Subject.objects.filter(id__in=subject_ids)
            if user.role == 'EVALUATOR':
                user.teaching_subjects.set(subjects)
            elif user.role == 'STUDENT':
                user.enrolled_subjects.set(subjects)

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    teaching_subjects = serializers.SerializerMethodField()
    enrolled_subjects = serializers.SerializerMethodField()
    assigned_teacher = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'phone_number',
            'profile_picture',
            'teaching_subjects',
            'enrolled_subjects',
            'assigned_teacher',
        )
        read_only_fields = ('id', 'role')

    def get_full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or obj.username

    def get_teaching_subjects(self, obj):
        if hasattr(obj, 'teaching_subjects'):
            return [
                {'id': s.id, 'name': s.name, 'code': s.code, 'department': s.department}
                for s in obj.teaching_subjects.all()
            ]
        return []

    def get_enrolled_subjects(self, obj):
        if hasattr(obj, 'enrolled_subjects'):
            return [
                {'id': s.id, 'name': s.name, 'code': s.code, 'department': s.department}
                for s in obj.enrolled_subjects.all()
            ]
        return []

    def get_assigned_teacher(self, obj):
        if obj.role != 'STUDENT':
            return None
        teacher = obj.assigned_teachers.first()
        if not teacher:
            return None
        return {
            'id': teacher.id,
            'username': teacher.username,
            'email': teacher.email,
            'full_name': f'{teacher.first_name} {teacher.last_name}'.strip() or teacher.username,
        }


class TeacherCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    subject_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)
    teaching_subjects = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'phone_number',
            'subject_ids',
            'teaching_subjects',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'created_at')

    def get_full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or obj.username

    def get_teaching_subjects(self, obj):
        if hasattr(obj, 'teaching_subjects'):
            return [
                {'id': s.id, 'name': s.name, 'code': s.code, 'department': s.department}
                for s in obj.teaching_subjects.all()
            ]
        return []

    def create(self, validated_data):
        password = validated_data.pop('password')
        subject_ids = validated_data.pop('subject_ids', [])
        validated_data['role'] = 'TEACHER'
        user = User.objects.create_user(password=password, **validated_data)
        if subject_ids:
            from apps.tests.models import Subject
            subjects = Subject.objects.filter(id__in=subject_ids)
            user.teaching_subjects.set(subjects)
        return user


class StudentCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    subject_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)
    enrolled_subjects = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'phone_number',
            'subject_ids',
            'enrolled_subjects',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'created_at')

    def get_full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or obj.username

    def get_enrolled_subjects(self, obj):
        if hasattr(obj, 'enrolled_subjects'):
            return [
                {'id': s.id, 'name': s.name, 'code': s.code, 'department': s.department}
                for s in obj.enrolled_subjects.all()
            ]
        return []

    def create(self, validated_data):
        password = validated_data.pop('password')
        subject_ids = validated_data.pop('subject_ids', [])
        validated_data['role'] = 'STUDENT'
        user = User.objects.create_user(password=password, **validated_data)
        if subject_ids:
            from apps.tests.models import Subject
            subjects = Subject.objects.filter(id__in=subject_ids)
            user.enrolled_subjects.set(subjects)
        return user


class TeacherManagementSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    subject_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)
    teaching_subjects = serializers.SerializerMethodField()
    assigned_students_count = serializers.SerializerMethodField()
    assigned_students = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'phone_number',
            'subject_ids',
            'teaching_subjects',
            'assigned_students_count',
            'assigned_students',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'created_at')

    def get_full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or obj.username

    def get_teaching_subjects(self, obj):
        if hasattr(obj, 'teaching_subjects'):
            return [
                {'id': s.id, 'name': s.name, 'code': s.code, 'department': s.department}
                for s in obj.teaching_subjects.all()
            ]
        return []

    def get_assigned_students_count(self, obj):
        if hasattr(obj, 'assigned_students'):
            return obj.assigned_students.count()
        return 0

    def get_assigned_students(self, obj):
        if hasattr(obj, 'assigned_students'):
            return [
                {
                    'id': s.id,
                    'username': s.username,
                    'email': s.email,
                    'full_name': f'{s.first_name} {s.last_name}'.strip() or s.username,
                }
                for s in obj.assigned_students.all()
            ]
        return []

    def update(self, instance, validated_data):
        subject_ids = validated_data.pop('subject_ids', None)
        instance = super().update(instance, validated_data)
        if subject_ids is not None:
            from apps.tests.models import Subject
            subjects = Subject.objects.filter(id__in=subject_ids)
            instance.teaching_subjects.set(subjects)
        return instance


class StudentManagementSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    subject_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)
    enrolled_subjects = serializers.SerializerMethodField()
    assigned_teachers = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'phone_number',
            'subject_ids',
            'enrolled_subjects',
            'assigned_teachers',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'created_at')

    def get_full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name or obj.username

    def get_enrolled_subjects(self, obj):
        if hasattr(obj, 'enrolled_subjects'):
            return [
                {'id': s.id, 'name': s.name, 'code': s.code, 'department': s.department}
                for s in obj.enrolled_subjects.all()
            ]
        return []

    def get_assigned_teachers(self, obj):
        if hasattr(obj, 'assigned_teachers'):
            return [
                {
                    'id': t.id,
                    'username': t.username,
                    'email': t.email,
                    'full_name': f'{t.first_name} {t.last_name}'.strip() or t.username,
                }
                for t in obj.assigned_teachers.all()
            ]
        return []

    def update(self, instance, validated_data):
        subject_ids = validated_data.pop('subject_ids', None)
        instance = super().update(instance, validated_data)
        if subject_ids is not None:
            from apps.tests.models import Subject
            subjects = Subject.objects.filter(id__in=subject_ids)
            instance.enrolled_subjects.set(subjects)
        return instance


class AssignStudentToTeacherSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(required=True)
    teacher_id = serializers.IntegerField(required=True)

    def validate(self, attrs):
        from .models import UserRole
        student = User.objects.filter(id=attrs['student_id'], role=UserRole.STUDENT).first()
        if not student:
            raise serializers.ValidationError({'student_id': 'Valid student ID is required.'})
        teacher = User.objects.filter(id=attrs['teacher_id'], role__in=(UserRole.EVALUATOR, UserRole.TEACHER)).first()
        if not teacher:
            raise serializers.ValidationError({'teacher_id': 'Valid teacher ID is required.'})
        attrs['student'] = student
        attrs['teacher'] = teacher
        return attrs


class AssignSubjectSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField(required=True)



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = False
        self.fields['email'] = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        login_id = (attrs.get(self.username_field) or attrs.get('email') or '').strip()
        if not login_id:
            raise serializers.ValidationError('Username or email is required.')
        user = User.objects.filter(username__iexact=login_id).first()
        if user is None:
            user = User.objects.filter(email__iexact=login_id).first()
        if user is not None:
            attrs[self.username_field] = user.username
        else:
            attrs[self.username_field] = login_id

        data = super().validate(attrs)
        profile = UserProfileSerializer(self.user).data
        data.update(profile)
        data['role'] = self.user.role
        data['user'] = profile
        return data
