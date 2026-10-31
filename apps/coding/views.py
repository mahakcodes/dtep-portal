from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.evaluations.models import AttemptStatus
from apps.tests.models import Test
from apps.users.permissions import IsEvaluatorUserRole, IsStudentUserRole

from .models import CodingQuestion, CodingTestCase
from .serializers import (
    CodingTestQuestionListSerializer,
    GradingAttemptQuerySerializer,
    GradingCaseSerializer,
    StudentCodingQuestionSerializer,
    TeacherCodingQuestionSerializer,
)


class CodingQuestionListCreateView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if request.user.role not in ('EVALUATOR', 'TEACHER'):
            raise PermissionDenied('Teacher access is required.')
        questions = CodingQuestion.objects.filter(owner=request.user).select_related('test').prefetch_related('test_cases')
        return Response(TeacherCodingQuestionSerializer(questions, many=True).data)

    def post(self, request):
        if not IsEvaluatorUserRole().has_permission(request, self):
            raise PermissionDenied('Teacher access is required.')
        serializer = TeacherCodingQuestionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return Response(TeacherCodingQuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class CodingQuestionDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def _teacher_question(self, request, pk):
        if not IsEvaluatorUserRole().has_permission(request, self):
            raise PermissionDenied('Teacher access is required.')
        return get_object_or_404(CodingQuestion.objects.prefetch_related('test_cases'), pk=pk, owner=request.user)

    def _student_question(self, request, pk):
        if not IsStudentUserRole().has_permission(request, self):
            raise PermissionDenied('Student access is required.')
        return get_object_or_404(
            CodingQuestion.objects.select_related('test', 'owner').prefetch_related('test_cases'),
            pk=pk,
            is_published=True,
            test__is_published=True,
            test__created_by__in=request.user.assigned_teachers.all(),
        )

    def get(self, request, pk):
        if request.user.role in ('EVALUATOR', 'TEACHER'):
            question = self._teacher_question(request, pk)
            return Response(TeacherCodingQuestionSerializer(question).data)
        question = self._student_question(request, pk)
        return Response(StudentCodingQuestionSerializer(question).data)

    def patch(self, request, pk):
        question = self._teacher_question(request, pk)
        serializer = TeacherCodingQuestionSerializer(
            question,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        question = serializer.save()
        return Response(TeacherCodingQuestionSerializer(question).data)


class CodingTestQuestionsListView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, test_id):
        if request.user.role in ('EVALUATOR', 'TEACHER'):
            test = get_object_or_404(Test, pk=test_id, created_by=request.user)
            questions = CodingQuestion.objects.filter(test=test)
        elif request.user.role == 'STUDENT':
            test = get_object_or_404(
                Test,
                pk=test_id,
                is_published=True,
                created_by__in=request.user.assigned_teachers.all(),
            )
            questions = CodingQuestion.objects.filter(test=test, is_published=True)
        else:
            raise PermissionDenied()
        return Response(CodingTestQuestionListSerializer(questions, many=True).data)


class CodingGradingCasesView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)

    def get(self, request, pk):
        question = get_object_or_404(
            CodingQuestion.objects.select_related('test'),
            pk=pk,
            is_published=True,
            test__is_published=True,
            test__created_by__in=request.user.assigned_teachers.all(),
        )
        query_serializer = GradingAttemptQuerySerializer(
            data={'attempt_id': request.query_params.get('attempt_id')},
            context={'request': request},
        )
        query_serializer.is_valid(raise_exception=True)
        attempt = query_serializer.context['attempt']
        if attempt.test_id != question.test_id:
            raise PermissionDenied('This coding question is not part of the attempt.')
        cases = CodingTestCase.objects.filter(question=question).order_by('order', 'id')
        return Response(GradingCaseSerializer(cases, many=True).data)
