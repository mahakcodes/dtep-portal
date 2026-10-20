from django.conf import settings
from django.db import models


class AttemptStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    STARTED = 'STARTED', 'Started'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    TERMINATED = 'TERMINATED', 'Terminated'


class ViolationType(models.TextChoices):
    TAB_SWITCH = 'TAB_SWITCH', 'Tab Switch'
    FULLSCREEN_EXIT = 'FULLSCREEN_EXIT', 'Fullscreen Exit'
    COPY_PASTE = 'COPY_PASTE', 'Copy/Paste'


class TestAttempt(models.Model):
    test = models.ForeignKey('tests.Test', on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='test_attempts',
    )
    status = models.CharField(max_length=20, choices=AttemptStatus.choices, default=AttemptStatus.IN_PROGRESS)
    client_session_id = models.CharField(max_length=64, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'test', 'status']),
        ]

    def __str__(self):
        return f'{self.student_id}:{self.test_id}:{self.status}'


class Response(models.Model):
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey('tests.Question', on_delete=models.CASCADE, related_name='responses')
    selected_option = models.ForeignKey(
        'tests.Option',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='responses',
    )
    descriptive_text = models.TextField(blank=True)
    awarded_marks = models.FloatField(blank=True, null=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='graded_responses',
    )
    graded_at = models.DateTimeField(blank=True, null=True)
    saved_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['attempt', 'question'], name='unique_attempt_question'),
        ]

    def __str__(self):
        return f'{self.attempt_id}:{self.question_id}'


class TestViolation(models.Model):
    attempt = models.ForeignKey(TestAttempt, on_delete=models.CASCADE, related_name='violations')
    violation_type = models.CharField(max_length=30, choices=ViolationType.choices)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['attempt', 'violation_type', 'timestamp']),
        ]
