from django.conf import settings
from django.db import models


class Result(models.Model):
    attempt = models.OneToOneField('evaluations.TestAttempt', on_delete=models.CASCADE, related_name='result')
    test = models.ForeignKey('tests.Test', on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='results')
    score = models.FloatField(default=0)
    max_score = models.FloatField(default=0)
    percentage = models.FloatField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'test']),
        ]

    def __str__(self):
        return f'{self.student_id}:{self.test_id}:{self.score}/{self.max_score}'
