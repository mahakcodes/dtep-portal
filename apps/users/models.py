from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserRole(models.TextChoices):
    STUDENT = 'STUDENT', 'Student'
    EVALUATOR = 'EVALUATOR', 'Evaluator'
    TEACHER = 'TEACHER', 'Teacher'
    ADMIN = 'ADMIN', 'Admin'


class CustomUserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        # Superuser ke liye role ADMIN set kar rahe hain
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(username, email, password, **extra_fields)

    def _create_user(self, username, email, password, **extra_fields):
        if not username:
            raise ValueError('The given username must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT)
    phone_number = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    assigned_teachers = models.ManyToManyField(
        'self',
        through='TeacherStudentMapping',
        through_fields=('student', 'teacher'),
        symmetrical=False,
        related_name='assigned_students',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()


class TeacherStudentMapping(models.Model):
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='student_mappings',
    )
    student = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='teacher_mappings',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # A student has one current teacher.  Reassignment updates this row,
            # rather than leaving historical mappings active.
            models.UniqueConstraint(fields=['student'], name='unique_student_teacher_mapping'),
        ]

    def __str__(self):
        return f'{self.teacher.username} -> {self.student.username}'
