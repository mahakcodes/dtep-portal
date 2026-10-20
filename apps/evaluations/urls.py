from django.urls import path

from .views import (
    GradeDescriptiveAnswerView,
    LogViolationView,
    PendingEvaluationsListView,
    SaveResponseView,
    StartTestView,
    SubmitTestView,
    TeacherSubmissionsListView,
)

urlpatterns = [
    path('start/', StartTestView.as_view(), name='evaluations-start'),
    path('save-response/', SaveResponseView.as_view(), name='evaluations-save-response'),
    path('submit/', SubmitTestView.as_view(), name='evaluations-submit'),
    path('pending/', PendingEvaluationsListView.as_view(), name='evaluations-pending'),
    path('submissions/', TeacherSubmissionsListView.as_view(), name='evaluations-teacher-submissions'),
    path('grade/', GradeDescriptiveAnswerView.as_view(), name='evaluations-grade'),
    path('violations/log/', LogViolationView.as_view(), name='evaluations-log-violation'),
]
