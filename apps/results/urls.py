from django.urls import path

from .views import ResultDetailView, TestAnalyticsView

urlpatterns = [
    path('<int:attempt_id>/', ResultDetailView.as_view(), name='results-detail'),
    path('test/<int:test_id>/analytics/', TestAnalyticsView.as_view(), name='results-test-analytics'),
]
