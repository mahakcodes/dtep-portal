from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.evaluations.attempts import finalize_if_expired
from apps.evaluations.models import AttemptStatus, TestAttempt, TestViolation, ViolationType
from apps.results.models import Result
from apps.tests.models import Option, Question, QuestionType, Test
from apps.users.models import TeacherStudentMapping, User


class AntiCheatEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(username='ac-teacher', password='pass', role='TEACHER')
        self.other_teacher = User.objects.create_user(username='ac-other-teacher', password='pass', role='TEACHER')
        self.student = User.objects.create_user(username='ac-student', password='pass', role='STUDENT')
        self.other_student = User.objects.create_user(username='ac-other-student', password='pass', role='STUDENT')
        self.test = Test.objects.create(
            title='Anti-cheat test', created_by=self.teacher, is_published=True, duration_minutes=30,
        )
        TeacherStudentMapping.objects.create(teacher=self.teacher, student=self.student)
        self.attempt = TestAttempt.objects.create(test=self.test, student=self.student)

    def log(self, violation_type, attempt=None):
        return self.client.post('/api/evaluations/violations/log/', {
            'attempt_id': (attempt or self.attempt).id,
            'violation_type': violation_type,
            'metadata': {'source': 'test'},
        }, format='json')

    def test_counting_events_dedupe_and_copy_paste_is_informational(self):
        self.client.force_authenticate(self.student)
        first = self.log(ViolationType.TAB_SWITCH)
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(first.data['count'], 1)
        duplicate = self.log(ViolationType.TAB_SWITCH)
        self.assertEqual(duplicate.status_code, 200, duplicate.data)
        self.assertEqual(duplicate.data['count'], 1)
        self.assertEqual(self.attempt.violations.count(), 1)
        informational = self.log(ViolationType.COPY_PASTE)
        self.assertEqual(informational.data['count'], 1)
        self.assertEqual(self.attempt.violations.count(), 2)
        self.assertFalse(informational.data['terminated'])

    @override_settings(MAX_TEST_VIOLATIONS=2)
    def test_threshold_terminates_and_finalizes_result_and_late_events_are_ignored(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.log(ViolationType.TAB_SWITCH).data['count'], 1)
        threshold = self.log(ViolationType.FULLSCREEN_EXIT)
        self.assertEqual(threshold.status_code, 200, threshold.data)
        self.assertEqual(threshold.data['count'], 2)
        self.assertEqual(threshold.data['max'], 2)
        self.assertTrue(threshold.data['terminated'])
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, AttemptStatus.TERMINATED)
        result = Result.objects.get(attempt=self.attempt)
        self.assertEqual(result.max_score, 0)

        late = self.log(ViolationType.TAB_SWITCH)
        self.assertEqual(late.status_code, 200, late.data)
        self.assertTrue(late.data['terminated'])
        self.assertEqual(self.attempt.violations.count(), 2)

    def test_violation_event_rejects_another_students_attempt(self):
        self.client.force_authenticate(self.other_student)
        response = self.log(ViolationType.TAB_SWITCH)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['code'], 'attempt_not_found')

    def test_invalid_violation_type_has_machine_readable_code(self):
        self.client.force_authenticate(self.student)
        response = self.log('TAB-HIDDEN')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['code'], 'invalid_violation_type')

    def test_clock_duration_zero_has_no_deadline_or_auto_timeout(self):
        self.test.duration_minutes = 0
        self.test.save(update_fields=['duration_minutes'])
        self.attempt.started_at = timezone.now() - timedelta(days=2)
        self.attempt.save(update_fields=['started_at'])
        self.client.force_authenticate(self.student)
        response = self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/clock/')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertIsNone(response.data['deadline'])
        self.assertIsNone(response.data['remaining_seconds'])
        self.assertEqual(response.data['status'], AttemptStatus.IN_PROGRESS)

    def test_clock_lazily_finalizes_expired_attempt_idempotently(self):
        self.attempt.started_at = timezone.now() - timedelta(minutes=31)
        self.attempt.save(update_fields=['started_at'])
        self.client.force_authenticate(self.student)
        first = self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/clock/')
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(first.data['status'], AttemptStatus.SUBMITTED)
        result_id = Result.objects.get(attempt=self.attempt).id
        second = self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/clock/')
        self.assertEqual(second.status_code, 200)
        self.assertEqual(Result.objects.get(attempt=self.attempt).id, result_id)
        self.assertEqual(Result.objects.filter(attempt=self.attempt).count(), 1)

    def test_teacher_can_read_owned_attempt_violations_only(self):
        TestViolation.objects.create(
            attempt=self.attempt, violation_type=ViolationType.COPY_PASTE, metadata={'action': 'paste'},
        )
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/violations/').status_code, 403)
        self.client.force_authenticate(self.other_teacher)
        self.assertEqual(self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/violations/').status_code, 404)
        self.client.force_authenticate(self.teacher)
        response = self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/violations/')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data[0]['type'], ViolationType.COPY_PASTE)
        self.assertFalse(response.data[0]['counts'])

    def test_clock_hides_another_students_attempt(self):
        self.client.force_authenticate(self.other_student)
        response = self.client.get(f'/api/evaluations/attempts/{self.attempt.id}/clock/')
        self.assertEqual(response.status_code, 404)

    def test_legacy_submit_rejects_terminated_latest_attempt(self):
        self.attempt.status = AttemptStatus.TERMINATED
        self.attempt.save(update_fields=['status'])
        self.client.force_authenticate(self.student)
        response = self.client.post(f'/api/tests/{self.test.id}/submit/', {'answers': []}, format='json')
        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(response.data['code'], 'attempt_terminated')
        self.assertEqual(TestAttempt.objects.filter(test=self.test, student=self.student).count(), 1)

    def test_legacy_submit_rejects_latest_finalized_attempt_without_replacement(self):
        self.client.force_authenticate(self.student)
        first = self.client.post(f'/api/tests/{self.test.id}/submit/', {'answers': []}, format='json')
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(TestAttempt.objects.filter(test=self.test, student=self.student).count(), 1)

    def test_evaluation_submit_and_response_save_reject_terminal_attempts_with_codes(self):
        question = Question.objects.create(
            test=self.test, text='Question', question_type=QuestionType.MCQ, marks=1,
        )
        option = Option.objects.create(question=question, text='Answer', is_correct=True)
        self.attempt.status = AttemptStatus.TERMINATED
        self.attempt.save(update_fields=['status'])
        self.client.force_authenticate(self.student)

        saved = self.client.post('/api/evaluations/save-response/', {
            'attempt_id': self.attempt.id,
            'question_id': question.id,
            'selected_option_id': option.id,
        }, format='json')
        self.assertEqual(saved.status_code, 400, saved.data)
        self.assertEqual(saved.data['code'], 'attempt_terminated')

        submitted = self.client.post('/api/evaluations/submit/', {
            'attempt_id': self.attempt.id,
        }, format='json')
        self.assertEqual(submitted.status_code, 400, submitted.data)
        self.assertEqual(submitted.data['code'], 'attempt_terminated')

    def test_server_accepts_write_in_grace_then_finalizes_after_grace(self):
        question = Question.objects.create(
            test=self.test, text='Question', question_type=QuestionType.MCQ, marks=1,
        )
        option = Option.objects.create(question=question, text='Answer', is_correct=True)
        self.attempt.started_at = timezone.now() - timedelta(minutes=30, seconds=20)
        self.attempt.save(update_fields=['started_at'])
        self.client.force_authenticate(self.student)
        within = self.client.post('/api/evaluations/save-response/', {
            'attempt_id': self.attempt.id,
            'question_id': question.id,
            'selected_option_id': option.id,
        }, format='json')
        self.assertEqual(within.status_code, 200, within.data)

        self.attempt.started_at = timezone.now() - timedelta(minutes=30, seconds=31)
        self.attempt.save(update_fields=['started_at'])
        expired = self.client.post('/api/evaluations/save-response/', {
            'attempt_id': self.attempt.id,
            'question_id': question.id,
            'selected_option_id': option.id,
        }, format='json')
        self.assertEqual(expired.status_code, 400, expired.data)
        self.assertEqual(expired.data['code'], 'attempt_expired')
        self.attempt.refresh_from_db()
        self.assertEqual(self.attempt.status, AttemptStatus.SUBMITTED)
        self.assertTrue(Result.objects.filter(attempt=self.attempt).exists())
        retry = self.client.post(f'/api/tests/{self.test.id}/submit/', {'answers': []}, format='json')
        self.assertEqual(retry.status_code, 400, retry.data)
        self.assertEqual(retry.data['code'], 'attempt_finalized')
        self.assertEqual(TestAttempt.objects.filter(test=self.test, student=self.student).count(), 1)

    def test_finalize_helper_is_noop_for_nonexpired_attempt(self):
        finalized = finalize_if_expired(self.attempt)
        self.assertEqual(finalized.status, AttemptStatus.IN_PROGRESS)
        self.assertFalse(Result.objects.filter(attempt=self.attempt).exists())
