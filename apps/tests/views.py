from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.evaluations.models import AttemptStatus, Response as ResponseModel, TestAttempt
from apps.evaluations.scoring import calculate_attempt_scores
from apps.results.models import Result
from apps.users.permissions import IsStudentUserRole

from .models import Option, Question, QuestionType, Subject, Test
from .serializers import (
    StudentTestSerializer,
    SubjectSerializer,
    TestSerializer,
)


class IsEvaluatorOrAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('EVALUATOR', 'TEACHER', 'ADMIN')
        )


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class TestListCreateView(ListCreateAPIView):
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsEvaluatorOrAdminRole()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if (
            self.request.user.is_authenticated
            and getattr(self.request.user, 'role', '') == 'STUDENT'
            and self.request.method == 'GET'
        ):
            return StudentTestSerializer
        return TestSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Test.objects.none()

        role = getattr(user, 'role', '')
        base_qs = (
            Test.objects.all()
            .select_related('subject', 'created_by')
            .prefetch_related('questions', 'questions__options')
        )

        if role == 'STUDENT':
            assigned_teachers = user.assigned_teachers.all()
            if not assigned_teachers.exists():
                return Test.objects.none()
            return (
                base_qs.filter(is_published=True, created_by__in=assigned_teachers)
                .distinct()
                .order_by('-created_at')
            )
        elif role in ('EVALUATOR', 'TEACHER'):
            teaching_subjects = user.teaching_subjects.all()
            return (
                base_qs.filter(Q(created_by=user) | Q(subject__in=teaching_subjects))
                .distinct()
                .order_by('-created_at')
            )
        elif role == 'ADMIN':
            return base_qs.order_by('-created_at')

        return Test.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class TestDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Test.objects.all().select_related('subject', 'created_by').prefetch_related(
        'questions', 'questions__options'
    )
    serializer_class = TestSerializer
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEvaluatorOrAdminRole()]

    def get_serializer_class(self):
        if getattr(self.request.user, 'role', '') == 'STUDENT':
            return StudentTestSerializer
        return TestSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', '')
        qs = (
            Test.objects.all()
            .select_related('subject', 'created_by')
            .prefetch_related('questions', 'questions__options')
        )
        if role == 'STUDENT':
            assigned_teachers = user.assigned_teachers.all()
            if not assigned_teachers.exists():
                return Test.objects.none()
            return qs.filter(is_published=True, created_by__in=assigned_teachers).distinct()

        if role in ('EVALUATOR', 'TEACHER'):
            # Teachers may only modify or delete assessments they authored.
            # Subject membership is enough to view a test, never to edit it.
            if self.request.method not in permissions.SAFE_METHODS:
                return qs.filter(created_by=user)
            return qs.filter(Q(created_by=user) | Q(subject__in=user.teaching_subjects.all())).distinct()
        if role == 'ADMIN':
            return qs
        return Test.objects.none()


class StudentTestDetailView(RetrieveAPIView):
    serializer_class = StudentTestSerializer
    permission_classes = (IsAuthenticated, IsStudentUserRole)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Test.objects.none()
        assigned_teachers = user.assigned_teachers.all()
        if not assigned_teachers.exists():
            return Test.objects.none()
        return (
            Test.objects.filter(is_published=True, created_by__in=assigned_teachers)
            .distinct()
            .select_related('subject', 'created_by')
            .prefetch_related('questions', 'questions__options')
        )


class TestSubmitView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)

    def post(self, request, pk, *args, **kwargs):
        test = get_object_or_404(Test, pk=pk)
        student = request.user

        # Verify authorization
        assigned_teachers = student.assigned_teachers.all()
        is_authorized = test.is_published and test.created_by in assigned_teachers
        if not is_authorized:
            return Response({'detail': 'You are not authorized to submit this test.'}, status=status.HTTP_403_FORBIDDEN)

        # Get or create TestAttempt
        attempt = TestAttempt.objects.filter(
            test=test,
            student=student,
            status__in=(AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED),
        ).order_by('-started_at').first()

        if not attempt:
            attempt = TestAttempt.objects.create(
                test=test,
                student=student,
                status=AttemptStatus.IN_PROGRESS,
            )

        # Save responses
        answers = request.data.get('answers', [])
        for ans in answers:
            qid = ans.get('question_id')
            q = test.questions.filter(id=qid).first()
            if not q:
                continue
            resp, _ = ResponseModel.objects.get_or_create(attempt=attempt, question=q)
            if q.question_type == QuestionType.MCQ:
                sel_opt_id = ans.get('selected_option_id')
                if sel_opt_id is not None:
                    opt = q.options.filter(id=sel_opt_id).first()
                    resp.selected_option = opt
                resp.descriptive_text = ''
            else:
                desc_text = ans.get('descriptive_text') or ans.get('text') or ''
                resp.descriptive_text = desc_text
                resp.selected_option = None
            resp.save()

        # Mark attempt submitted
        attempt.status = AttemptStatus.SUBMITTED
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=['status', 'submitted_at'])

        # Calculate scores
        scoring = calculate_attempt_scores(attempt)

        result, _ = Result.objects.update_or_create(
            attempt=attempt,
            defaults={
                'student': student,
                'test': test,
                'score': scoring['score'],
                'max_score': scoring['max_score'],
                'percentage': scoring['percentage'],
                'correct_answers': scoring['correct_answers'],
                'total_questions': scoring['total_questions'],
            },
        )

        return Response(
            {
                'submission_id': attempt.id,
                'score': result.score,
                'total_marks': result.max_score,
                'percentage': result.percentage,
                'passed': result.percentage >= 50.0,
                'result_id': result.id,
            },
            status=status.HTTP_200_OK,
        )


class SubjectListCreateView(ListCreateAPIView):
    serializer_class = SubjectSerializer
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsEvaluatorOrAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Subject.objects.all().prefetch_related('teachers', 'students')

        filter_type = self.request.query_params.get('filter')
        if filter_type == 'enrolled' and hasattr(user, 'enrolled_subjects'):
            return user.enrolled_subjects.all().prefetch_related('teachers', 'students')
        elif filter_type == 'teaching' and hasattr(user, 'teaching_subjects'):
            return user.teaching_subjects.all().prefetch_related('teachers', 'students')

        return qs


class SubjectDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all().prefetch_related('teachers', 'students')
    serializer_class = SubjectSerializer
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsEvaluatorOrAdminRole()]
