from django.urls import path

from .views import (
    GradeDescriptiveAnswerView,
    AttemptClockView,
    AttemptViolationsView,
    LogViolationView,
    PendingEvaluationsListView,
    SaveResponseView,
    StartTestView,
    SubmitTestView,
    TeacherSubmissionsListView,
)

urlpatterns = [
    path('attempts/<int:attempt_id>/clock/', AttemptClockView.as_view(), name='evaluations-attempt-clock'),
    path('attempts/<int:attempt_id>/violations/', AttemptViolationsView.as_view(), name='evaluations-attempt-violations'),
    path('start/', StartTestView.as_view(), name='evaluations-start'),
    path('save-response/', SaveResponseView.as_view(), name='evaluations-save-response'),
    path('submit/', SubmitTestView.as_view(), name='evaluations-submit'),
    path('pending/', PendingEvaluationsListView.as_view(), name='evaluations-pending'),
    path('submissions/', TeacherSubmissionsListView.as_view(), name='evaluations-teacher-submissions'),
    path('grade/', GradeDescriptiveAnswerView.as_view(), name='evaluations-grade'),
    path('violations/log/', LogViolationView.as_view(), name='evaluations-log-violation'),
]
