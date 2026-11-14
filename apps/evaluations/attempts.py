from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException

from apps.results.models import Result

from .models import AttemptStatus, TestAttempt
from .scoring import calculate_attempt_scores


SUBMIT_GRACE = timedelta(seconds=30)


class AttemptStateError(APIException):
    status_code = 400
    default_code = 'attempt_invalid'

    def __init__(self, field, message, code):
        super().__init__({field: message, 'code': code}, code=code)


def attempt_deadline(attempt):
    duration = attempt.test.duration_minutes
    if not duration:
        return None
    return attempt.started_at + timedelta(minutes=duration)


def attempt_end_reason(attempt):
    if attempt.status == AttemptStatus.TERMINATED:
        return 'terminated'
    if attempt.status == AttemptStatus.SUBMITTED:
        deadline = attempt_deadline(attempt)
        if deadline and attempt.submitted_at and attempt.submitted_at >= deadline:
            return 'timeout'
        return 'submitted'
    return None


def write_attempt_result(attempt):
    scoring = calculate_attempt_scores(attempt)
    return Result.objects.update_or_create(
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


def finalize_if_expired(attempt, now=None):
    """Finalize an active attempt after its 30-second submission grace."""
    now = now or timezone.now()
    with transaction.atomic():
        locked = (
            TestAttempt.objects.select_for_update(of=('self',))
            .select_related('test', 'student')
            .get(pk=attempt.pk)
        )
        deadline = attempt_deadline(locked)
        if (
            locked.status in (AttemptStatus.IN_PROGRESS, AttemptStatus.STARTED)
            and deadline is not None
            and now > deadline + SUBMIT_GRACE
        ):
            locked.status = AttemptStatus.SUBMITTED
            locked.submitted_at = now
            locked.save(update_fields=['status', 'submitted_at'])
            write_attempt_result(locked)
        attempt.status = locked.status
        attempt.submitted_at = locked.submitted_at
        return locked


def require_active_attempt(attempt, now=None):
    """Validate an attempt write and lazily finalize it if its grace elapsed."""
    now = now or timezone.now()
    locked = finalize_if_expired(attempt, now=now)
    if locked.status == AttemptStatus.TERMINATED:
        raise AttemptStateError('attempt_id', 'Attempt was terminated.', 'attempt_terminated')
    if locked.status == AttemptStatus.SUBMITTED:
        code = 'attempt_expired' if attempt_deadline(locked) and now > attempt_deadline(locked) + SUBMIT_GRACE else 'attempt_finalized'
        message = 'Attempt has expired.' if code == 'attempt_expired' else 'Attempt is already submitted.'
        raise AttemptStateError('attempt_id', message, code)
    deadline = attempt_deadline(locked)
    if deadline is not None and now > deadline + SUBMIT_GRACE:
        raise AttemptStateError('attempt_id', 'Attempt has expired.', 'attempt_expired')
    return locked
