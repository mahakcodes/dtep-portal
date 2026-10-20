from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AssignStudentToTeacherView,
    AssignSubjectToTeacherView,
    CustomTokenObtainPairView,
    EnrollStudentInSubjectView,
    RegisterView,
    StudentListView,
    TeacherListView,
    UnassignStudentFromTeacherView,
    UserProfileView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='users-register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='users-login'),
    path('profile/', UserProfileView.as_view(), name='users-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='users-token-refresh'),
    path('teachers/', TeacherListView.as_view(), name='users-teachers-list'),
    path('teachers/<int:pk>/assign-subject/', AssignSubjectToTeacherView.as_view(), name='users-teacher-assign-subject'),
    path('students/', StudentListView.as_view(), name='users-students-list'),
    path('students/<int:pk>/enroll/', EnrollStudentInSubjectView.as_view(), name='users-student-enroll'),
    path('assign-student/', AssignStudentToTeacherView.as_view(), name='users-assign-student'),
    path('unassign-student/', UnassignStudentFromTeacherView.as_view(), name='users-unassign-student'),
]
