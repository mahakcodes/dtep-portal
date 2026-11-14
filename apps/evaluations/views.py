from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.results.models import Result
from apps.tests.models import QuestionType
from apps.users.permissions import IsEvaluatorUserRole, IsStudentUserRole

from .models import AttemptStatus, Response as ResponseModel, TestAttempt, TestViolation, ViolationType
from .scoring import calculate_attempt_scores
from .attempts import (
    attempt_deadline,
    finalize_if_expired,
    write_attempt_result,
)
from .serializers import (
    GradeDescriptiveAnswerSerializer,
    LogViolationSerializer,
    AttemptViolationSerializer,
    PendingEvaluationSerializer,
    ResponseSerializer,
    SaveResponseSerializer,
    StartTestSerializer,
    SubmitTestSerializer,
    TeacherSubmissionSerializer,
    TestAttemptSerializer,
)


class StartTestView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)

    def post(self, request, *args, **kwargs):
        serializer = StartTestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        attempt = serializer.save()
        return Response(TestAttemptSerializer(attempt).data, status=201)


class SaveResponseView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'autosave'

    def post(self, request, *args, **kwargs):
        serializer = SaveResponseSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        response = serializer.save()
        return Response(ResponseSerializer(response).data, status=200)


class SubmitTestView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)

    def post(self, request, *args, **kwargs):
        serializer = SubmitTestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        attempt = serializer.save()

        scoring = calculate_attempt_scores(attempt)

        result, _created = Result.objects.update_or_create(
            attempt=attempt,
            defaults={
                'student': attempt.student,
                'test': attempt.test,
                'score': scoring['score'],
                'max_score': scoring['max_score'],
                'percentage': scoring['percentage'],
                'correct_answers': scoring['correct_answers'],
                'total_questions': scoring['total_questions'],
            },
        )

        return Response(
            {
                'attempt_id': attempt.id,
                'status': attempt.status,
                'score': result.score,
                'max_score': result.max_score,
                'percentage': result.percentage,
                'correct_answers': result.correct_answers,
                'total_questions': result.total_questions,
                'result_id': result.id,
            },
            status=200,
        )


class PendingEvaluationsListView(APIView):
    permission_classes = (IsAuthenticated, IsEvaluatorUserRole)

    def get(self, request, *args, **kwargs):
        finalize_expired_for_teacher(request.user)
        attempts = (
            TestAttempt.objects.filter(
                status=AttemptStatus.SUBMITTED,
                test__created_by=request.user,
                student__teacher_mappings__teacher=request.user,
            )
            .annotate(
                descriptive_count=Count(
                    'test__questions',
                    filter=Q(test__questions__question_type=QuestionType.DESCRIPTIVE),
                    distinct=True,
                ),
                graded_count=Count(
                    'responses',
                    filter=Q(
                        responses__question__question_type=QuestionType.DESCRIPTIVE,
                        responses__awarded_marks__isnull=False,
                    ),
                    distinct=True,
                ),
            )
            .annotate(pending_descriptive_count=F('descriptive_count') - F('graded_count'))
            .filter(descriptive_count__gt=F('graded_count'))
            .select_related('student', 'test')
            .order_by('-submitted_at')
        )

        return Response(PendingEvaluationSerializer(attempts, many=True).data, status=200        )


class TeacherSubmissionsListView(APIView):
    permission_classes = (IsAuthenticated, IsEvaluatorUserRole)

    def get(self, request, *args, **kwargs):
        test_id = request.query_params.get('test_id')
        user = request.user
        finalize_expired_for_teacher(user)
        attempts = (
            TestAttempt.objects.filter(
                test__created_by=user,
                student__teacher_mappings__teacher=user,
            )
            .exclude(status=AttemptStatus.IN_PROGRESS)
            .select_related('student', 'test', 'test__subject', 'result')
            .prefetch_related('responses', 'responses__selected_option', 'test__questions')
            .order_by('-submitted_at', '-started_at')
        )
        if test_id:
            attempts = attempts.filter(test_id=test_id)
        return Response(TeacherSubmissionSerializer(attempts, many=True).data, status=200)



class GradeDescriptiveAnswerView(APIView):
    permission_classes = (IsAuthenticated, IsEvaluatorUserRole)

    def post(self, request, *args, **kwargs):
        serializer = GradeDescriptiveAnswerSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        attempt = serializer.validated_data['attempt']
        question = serializer.validated_data['question']

        response, _created = ResponseModel.objects.get_or_create(attempt=attempt, question=question)
        response.awarded_marks = serializer.validated_data['awarded_marks']
        response.feedback = serializer.validated_data.get('feedback', '')
        response.graded_by = request.user
        response.graded_at = timezone.now()
        response.save()

        scoring = calculate_attempt_scores(attempt)

        result, _created = Result.objects.update_or_create(
            attempt=attempt,
            defaults={
                'student': attempt.student,
                'test': attempt.test,
                'score': scoring['score'],
                'max_score': scoring['max_score'],
                'percentage': scoring['percentage'],
                'correct_answers': scoring['correct_answers'],
                'total_questions': scoring['total_questions'],
            },
        )

        pending_descriptive_count = (
            attempt.test.questions.filter(question_type=QuestionType.DESCRIPTIVE).count()
            - ResponseModel.objects.filter(
                attempt=attempt,
                question__question_type=QuestionType.DESCRIPTIVE,
                awarded_marks__isnull=False,
            ).count()
        )

        return Response(
            {
                'attempt_id': attempt.id,
                'question_id': question.id,
                'awarded_marks': response.awarded_marks,
                'feedback': response.feedback,
                'result_id': result.id,
                'score': result.score,
                'max_score': result.max_score,
                'percentage': result.percentage,
                'pending_descriptive_count': pending_descriptive_count,
            },
            status=200,
        )


class LogViolationView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'violation'

    def post(self, request, *args, **kwargs):
        serializer = LogViolationSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            error_data = dict(serializer.errors)
            error_data.setdefault('code', 'invalid_request')
            if isinstance(error_data.get('code'), (list, tuple)):
                error_data['code'] = str(error_data['code'][0])
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        now = timezone.now()
        counting_types = (ViolationType.TAB_SWITCH, ViolationType.FULLSCREEN_EXIT)

        with transaction.atomic():
            attempt = (
                TestAttempt.objects.select_for_update()
                .select_related('test', 'student')
                .get(pk=data['attempt'].pk, student=request.user)
            )
            attempt = finalize_if_expired(attempt, now=now)
            latest_status = attempt.status
            ignored = latest_status in (AttemptStatus.SUBMITTED, AttemptStatus.TERMINATED)
            duplicate = False
            violation = None

            if not ignored:
                violation_type = data['violation_type']
                if violation_type in counting_types:
                    duplicate = attempt.violations.filter(
                        violation_type=violation_type,
                        timestamp__gte=now - timedelta(seconds=3),
                    ).exists()
                if not duplicate:
                    violation = TestViolation.objects.create(
                        attempt=attempt,
                        violation_type=violation_type,
                        metadata=data.get('metadata') or {},
                    )

                violations_count = attempt.violations.filter(violation_type__in=counting_types).count()
                if violation_type in counting_types and violations_count >= settings.MAX_TEST_VIOLATIONS:
                    attempt.status = AttemptStatus.TERMINATED
                    attempt.submitted_at = now
                    attempt.save(update_fields=['status', 'submitted_at'])
                    write_attempt_result(attempt)

            violations_count = attempt.violations.filter(violation_type__in=counting_types).count()
            terminated = attempt.status in (AttemptStatus.SUBMITTED, AttemptStatus.TERMINATED)
            response_data = {
                'attempt_id': attempt.id,
                'violation_id': violation.id if violation else None,
                'violation_type': data['violation_type'],
                'violations_count': violations_count,
                'terminated': terminated,
                'status': attempt.status,
                'count': violations_count,
                'max': settings.MAX_TEST_VIOLATIONS,
            }
        return Response(response_data, status=status.HTTP_200_OK)


def finalize_expired_for_teacher(teacher):
    expired_candidates = TestAttempt.objects.filter(
        test__created_by=teacher,
        student__teacher_mappings__teacher=teacher,
        status__in=(AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED),
        test__duration_minutes__gt=0,
    ).select_related('test', 'student').distinct()
    for attempt in expired_candidates:
        finalize_if_expired(attempt)


class AttemptClockView(APIView):
    permission_classes = (IsAuthenticated, IsStudentUserRole)

    def get(self, request, attempt_id):
        attempt = get_object_or_404(
            TestAttempt.objects.select_related('test'), pk=attempt_id, student=request.user,
        )
        attempt = finalize_if_expired(attempt)
        now = timezone.now()
        deadline = attempt_deadline(attempt)
        remaining = None if deadline is None else max(0, int((deadline - now).total_seconds()))
        count = attempt.violations.filter(
            violation_type__in=(ViolationType.TAB_SWITCH, ViolationType.FULLSCREEN_EXIT),
        ).count()
        return Response({
            'server_time': now.isoformat(),
            'deadline': deadline.isoformat() if deadline else None,
            'remaining_seconds': remaining,
            'status': attempt.status,
            'violations': {'count': count, 'max': settings.MAX_TEST_VIOLATIONS},
        })


class AttemptViolationsView(APIView):
    permission_classes = (IsAuthenticated, IsEvaluatorUserRole)

    def get(self, request, attempt_id):
        attempt = get_object_or_404(
            TestAttempt.objects.select_related('test'),
            pk=attempt_id,
            test__created_by=request.user,
        )
        violations = attempt.violations.order_by('timestamp', 'id')
        return Response(AttemptViolationSerializer(violations, many=True).data)
