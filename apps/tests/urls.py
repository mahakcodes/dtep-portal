from django.urls import path

from .views import (
    StudentTestDetailView,
    SubjectDetailView,
    SubjectListCreateView,
    TestDetailView,
    TestListCreateView,
    TestSubmitView,
)

urlpatterns = [
    path('', TestListCreateView.as_view(), name='tests-list-create'),
    path('<int:pk>/', TestDetailView.as_view(), name='tests-detail'),
    path('<int:pk>/student/', StudentTestDetailView.as_view(), name='tests-student-detail'),
    path('<int:pk>/submit/', TestSubmitView.as_view(), name='tests-submit'),
    path('subjects/', SubjectListCreateView.as_view(), name='subjects-list-create'),
    path('subjects/<int:pk>/', SubjectDetailView.as_view(), name='subjects-detail'),
]
