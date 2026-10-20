from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from apps.results.models import Result

from .models import AttemptStatus, TestAttempt
from .scoring import calculate_attempt_scores


@shared_task
def auto_submit_expired_attempts():
    now = timezone.now()
    attempts = (
        TestAttempt.objects.filter(
            status__in=(AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED),
            test__duration_minutes__gt=0,
        )
        .select_related('test', 'student')
        .prefetch_related('test__questions')
    )

    processed = 0
    for attempt in attempts:
        expires_at = attempt.started_at + timedelta(minutes=attempt.test.duration_minutes)
        if now <= expires_at:
            continue

        with transaction.atomic():
            attempt.status = AttemptStatus.SUBMITTED
            attempt.submitted_at = now
            attempt.save(update_fields=['status', 'submitted_at'])

            scoring = calculate_attempt_scores(attempt)

            Result.objects.update_or_create(
                attempt=attempt,
                defaults={
                    'student': attempt.student,
                    'test': attempt.test,
                    'score': scoring['score'],
                    'max_score': scoring['max_score'],
                    'percentage': scoring['percentage'],
                    'correct_answers': scoring['correct_answers'],
                    'total_questions': scoring['total_questions'],
                },
            )

            processed += 1

    return processed
