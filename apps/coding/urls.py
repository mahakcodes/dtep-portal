from django.urls import path

from .views import (
    CodingGradingCasesView,
    CodingQuestionDetailView,
    CodingQuestionListCreateView,
    CodingTestQuestionsListView,
)

urlpatterns = [
    path('questions/', CodingQuestionListCreateView.as_view(), name='coding-questions-list-create'),
    path('questions/<int:pk>/', CodingQuestionDetailView.as_view(), name='coding-question-detail'),
    path('questions/<int:pk>/grading-cases/', CodingGradingCasesView.as_view(), name='coding-question-grading-cases'),
    path('tests/<int:test_id>/questions/', CodingTestQuestionsListView.as_view(), name='coding-test-questions-list'),
]
