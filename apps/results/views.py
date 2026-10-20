from django.shortcuts import get_object_or_404
from django.db.models import Avg, Max, Min
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.tests.models import Test
from apps.users.permissions import IsEvaluatorUserRole

from .models import Result
from .serializers import ResultSerializer


class ResultDetailView(RetrieveAPIView):
    serializer_class = ResultSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        attempt_id = self.kwargs['attempt_id']
        from django.db.models import Q
        result = (
            Result.objects.select_related('test', 'attempt', 'student')
            .filter(Q(attempt_id=attempt_id) | Q(id=attempt_id))
            .first()
        )
        if not result:
            from rest_framework.exceptions import NotFound
            raise NotFound('Result not found.')

        user = self.request.user
        role = getattr(user, 'role', '')
        if role == 'STUDENT' and result.student_id != user.id:
            raise PermissionDenied('You can only view your own results.')
        if role in ('EVALUATOR', 'TEACHER'):
            is_own_test = result.test.created_by_id == user.id
            is_assigned_student = hasattr(user, 'assigned_students') and user.assigned_students.filter(id=result.student_id).exists()
            if not (is_own_test and is_assigned_student):
                raise PermissionDenied('You can only view assigned students\' submissions for tests you created.')
        if role not in ('STUDENT', 'EVALUATOR', 'TEACHER', 'ADMIN'):
            raise PermissionDenied()
        return result



class TestAnalyticsView(APIView):
    permission_classes = (IsAuthenticated, IsEvaluatorUserRole)

    def get(self, request, test_id, *args, **kwargs):
        get_object_or_404(Test, id=test_id, created_by=request.user)
        qs = Result.objects.filter(
            test_id=test_id,
            test__created_by=request.user,
            student__teacher_mappings__teacher=request.user,
        )
        stats = qs.aggregate(avg_score=Avg('score'), max_score=Max('score'), min_score=Min('score'))

        return Response(
            {
                'test_id': test_id,
                'total_submissions': qs.count(),
                'average_score': stats['avg_score'] or 0,
                'highest_score': stats['max_score'] or 0,
                'lowest_score': stats['min_score'] or 0,
            },
            status=200,
        )
