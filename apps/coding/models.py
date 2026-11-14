from django.conf import settings
from django.db import models


class CodingQuestion(models.Model):
    test = models.ForeignKey('tests.Test', on_delete=models.CASCADE, related_name='coding_questions')
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_coding_questions',
    )
    title = models.CharField(max_length=255)
    statement = models.TextField(max_length=20000)
    constraints = models.TextField(max_length=10000, blank=True, default='')
    starter_code = models.JSONField(default=dict, blank=True)
    allowed_languages = models.JSONField(default=list)
    max_marks = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('order', 'id')
        indexes = [models.Index(fields=('test', 'order'))]

    def __str__(self):
        return f'{self.test_id}: {self.title}'


class CodingTestCase(models.Model):
    question = models.ForeignKey(CodingQuestion, on_delete=models.CASCADE, related_name='test_cases')
    input_data = models.CharField(max_length=10000, blank=True, default='')
    expected_output = models.CharField(max_length=10000)
    is_hidden = models.BooleanField(default=False)
    marks = models.PositiveIntegerField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('order', 'id')
        constraints = [
            models.UniqueConstraint(fields=('question', 'order'), name='coding_case_question_order_uniq'),
        ]
        indexes = [models.Index(fields=('question', 'is_hidden', 'order'))]

    def __str__(self):
        return f'{self.question_id}: case {self.order}'


class CodingSubmission(models.Model):
    class Status(models.TextChoices):
        ACCEPTED = 'accepted', 'Accepted'
        PARTIAL = 'partial', 'Partial'
        WRONG = 'wrong', 'Wrong'
        RUNTIME_ERROR = 'runtime_error', 'Runtime error'
        TIMEOUT = 'timeout', 'Timeout'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='coding_submissions',
    )
    question = models.ForeignKey(CodingQuestion, on_delete=models.CASCADE, related_name='submissions')
    attempt = models.ForeignKey(
        'evaluations.TestAttempt',
        on_delete=models.CASCADE,
        related_name='coding_submissions',
    )
    language = models.CharField(max_length=20)
    source_code = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices)
    score = models.FloatField(default=0)
    max_score = models.FloatField(default=0)
    passed_count = models.PositiveIntegerField(default=0)
    total_count = models.PositiveIntegerField(default=0)
    case_results = models.JSONField(default=list)
    graded_by = models.CharField(max_length=20, default='browser')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=('attempt', 'question', '-created_at')),
            models.Index(fields=('student', 'question')),
        ]

    def __str__(self):
        return f'{self.student_id}:{self.question_id}:{self.status}'
