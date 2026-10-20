from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import TeacherStudentMapping, UserRole
from .serializers import (
    AssignStudentToTeacherSerializer,
    AssignSubjectSerializer,
    CustomTokenObtainPairSerializer,
    StudentCreateSerializer,
    StudentManagementSerializer,
    TeacherCreateSerializer,
    TeacherManagementSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)

User = get_user_model()


class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class RegisterView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        profile_data = UserProfileSerializer(user).data
        return Response(profile_data, status=201)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return self.request.user


class TeacherListView(ListCreateAPIView):
    serializer_class = TeacherManagementSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TeacherCreateSerializer
        return TeacherManagementSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUserRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return User.objects.filter(role__in=(UserRole.EVALUATOR, UserRole.TEACHER)).prefetch_related(
            'teaching_subjects', 'assigned_students'
        )


class StudentListView(ListCreateAPIView):
    serializer_class = StudentManagementSerializer
    permission_classes = (IsAuthenticated,)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentCreateSerializer
        return StudentManagementSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUserRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(role=UserRole.STUDENT).prefetch_related('enrolled_subjects', 'assigned_teachers')
        if user.is_authenticated and user.role in (UserRole.EVALUATOR, UserRole.TEACHER):
            return qs.filter(teacher_mappings__teacher=user).distinct()
        return qs


class AssignStudentToTeacherView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def post(self, request, *args, **kwargs):
        serializer = AssignStudentToTeacherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.validated_data['student']
        teacher = serializer.validated_data['teacher']

        # The mapping is the canonical current assignment.  Removing any prior
        # row makes assignment idempotent and turns this endpoint into a safe
        # reassignment operation.
        with transaction.atomic():
            previous_teacher_ids = list(
                TeacherStudentMapping.objects.select_for_update()
                .filter(student=student)
                .values_list('teacher_id', flat=True)
            )
            mapping, created = TeacherStudentMapping.objects.update_or_create(
                student=student,
                defaults={'teacher': teacher},
            )
        return Response(
            {
                'message': f'Student {student.username} assigned to teacher {teacher.username} successfully',
                'reassigned': bool(previous_teacher_ids and teacher.id not in previous_teacher_ids),
                'student': StudentManagementSerializer(student).data,
                'teacher': TeacherManagementSerializer(teacher).data,
            },
            status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED,
        )


class UnassignStudentFromTeacherView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def post(self, request, *args, **kwargs):
        serializer = AssignStudentToTeacherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.validated_data['student']
        teacher = serializer.validated_data['teacher']

        TeacherStudentMapping.objects.filter(student=student, teacher=teacher).delete()
        return Response(
            {
                'message': f'Student {student.username} unassigned from teacher {teacher.username}',
                'student': StudentManagementSerializer(student).data,
            },
            status=status.HTTP_200_OK,
        )


class AssignSubjectToTeacherView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def post(self, request, pk, *args, **kwargs):
        serializer = AssignSubjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = get_object_or_404(User, pk=pk, role__in=(UserRole.EVALUATOR, UserRole.TEACHER))

        from apps.tests.models import Subject
        subject = get_object_or_404(Subject, pk=serializer.validated_data['subject_id'])
        teacher.teaching_subjects.add(subject)

        return Response(
            {
                'message': f'Subject {subject.code} assigned to {teacher.username} successfully',
                'teacher': TeacherManagementSerializer(teacher).data,
            },
            status=status.HTTP_200_OK,
        )


class EnrollStudentInSubjectView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def post(self, request, pk, *args, **kwargs):
        serializer = AssignSubjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = get_object_or_404(User, pk=pk, role=UserRole.STUDENT)

        from apps.tests.models import Subject
        subject = get_object_or_404(Subject, pk=serializer.validated_data['subject_id'])
        student.enrolled_subjects.add(subject)

        return Response(
            {
                'message': f'Student {student.username} enrolled in {subject.code} successfully',
                'student': StudentManagementSerializer(student).data,
            },
            status=status.HTTP_200_OK,
        )
