from datetime import timedelta

from django.core.cache import cache
from django.db.models import FloatField
from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from apps.evaluations.models import AttemptStatus, TestAttempt
from apps.evaluations.models import Response as AttemptResponse
from apps.evaluations.scoring import calculate_attempt_scores
from apps.results.models import Result
from apps.tests.models import Option, Question, QuestionType, Test as AssessmentTest
from apps.users.models import TeacherStudentMapping, User

from .models import CodingQuestion, CodingSubmission, CodingTestCase
from .serializers import CodingSubmissionInputSerializer
from .utils import normalize_output, sha256_hex


class OutputNormalizationTests(SimpleTestCase):
    def test_shared_normalization_vector(self):
        self.assertEqual(normalize_output('a  \r\nb\n\n'), 'a\nb')

    def test_shared_hash_vector(self):
        self.assertEqual(
            sha256_hex('a\nb'),
            '7e18f737311b2dc3b2f269dd78396b0351f14fb66efa879f768cb23181883c78',
        )

    def test_normalized_output_hash_vector(self):
        self.assertEqual(
            sha256_hex(normalize_output('8\n')),
            '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
        )

    def test_normalization_preserves_tabs_and_lone_carriage_returns(self):
        self.assertEqual(normalize_output('a\t \nb\r '), 'a\t\nb\r')


class CodingSubmissionStatusTests(SimpleTestCase):
    def test_overall_status_choices(self):
        self.assertEqual(
            {value for value, _label in CodingSubmission.Status.choices},
            {'accepted', 'partial', 'wrong', 'runtime_error', 'timeout'},
        )

    def test_submission_input_serializer_enforces_source_limit(self):
        valid = CodingSubmissionInputSerializer(data={'language': 'python', 'source_code': 'x' * 100000})
        self.assertTrue(valid.is_valid(), valid.errors)
        too_long = CodingSubmissionInputSerializer(data={'language': 'python', 'source_code': 'x' * 100001})
        self.assertFalse(too_long.is_valid())


class CodingQuestionAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.teacher = User.objects.create_user(username='teacher', password='pass', role='TEACHER')
        self.other_teacher = User.objects.create_user(username='other-teacher', password='pass', role='TEACHER')
        self.student = User.objects.create_user(username='student', password='pass', role='STUDENT')
        self.unassigned_student = User.objects.create_user(username='unassigned', password='pass', role='STUDENT')
        self.test = AssessmentTest.objects.create(title='Assessment', created_by=self.teacher, duration_minutes=30)
        self.other_test = AssessmentTest.objects.create(title='Other', created_by=self.other_teacher)
        TeacherStudentMapping.objects.create(teacher=self.teacher, student=self.student)
        self.client = APIClient()

    def payload(self, test_id=None, **overrides):
        data = {
            'test_id': test_id or self.test.id,
            'title': 'Sum two numbers',
            'statement': 'Read two values and print their sum.',
            'constraints': 'Integers only.',
            'starter_code': {'python': '', 'javascript': ''},
            'allowed_languages': ['python', 'javascript'],
            'max_marks': 10,
            'is_published': True,
            'test_cases': [
                {'input': '2 3', 'expected_output': '5', 'is_hidden': False, 'marks': 2, 'order': 80},
                {'input': '8 9', 'expected_output': '17', 'is_hidden': True, 'marks': 8, 'order': 81},
            ],
        }
        data.update(overrides)
        return data

    def create_question(self, test=None):
        test = test or self.test
        return CodingQuestion.objects.create(
            test=test,
            owner=test.created_by,
            title='Sum two numbers',
            statement='Read and add.',
            starter_code={'python': ''},
            allowed_languages=['python'],
            max_marks=10,
            is_published=True,
        )

    def create_submission(self, question, student=None):
        student = student or self.student
        attempt = TestAttempt.objects.create(test=question.test, student=student)
        return CodingSubmission.objects.create(
            student=student,
            question=question,
            attempt=attempt,
            language='python',
            source_code='print(1)',
            status=CodingSubmission.Status.ACCEPTED,
            score=question.max_marks,
            max_score=question.max_marks,
            passed_count=2,
            total_count=2,
            case_results=[],
        )

    def add_cases(self, question):
        visible = CodingTestCase.objects.create(
            question=question, input_data='2 3', expected_output='5', is_hidden=False, marks=2, order=0,
        )
        hidden = CodingTestCase.objects.create(
            question=question, input_data='8 9', expected_output='SECRET-EXPECTED-17', is_hidden=True, marks=8, order=1,
        )
        return visible, hidden

    def test_teacher_create_requires_owned_test_and_assigns_case_order(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post('/api/coding/questions/', self.payload(), format='json')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(
            list(CodingTestCase.objects.filter(question_id=response.data['id']).values_list('order', flat=True)),
            [0, 1],
        )
        denied = self.client.post('/api/coding/questions/', self.payload(test_id=self.other_test.id), format='json')
        self.assertEqual(denied.status_code, 400)

    def test_teacher_replaces_cases_atomically_with_server_assigned_order(self):
        question = self.create_question()
        self.add_cases(question)
        self.client.force_authenticate(self.teacher)
        response = self.client.patch(
            f'/api/coding/questions/{question.id}/',
            {'test_cases': [
                {'input': '4 1', 'expected_output': '5', 'is_hidden': False, 'marks': 5, 'order': 88},
                {'input': '7 7', 'expected_output': '14', 'is_hidden': True, 'marks': 5, 'order': 89},
            ]},
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(list(question.test_cases.values_list('order', flat=True)), [0, 1])
        self.assertEqual(question.test_cases.count(), 2)

    def test_question_create_validates_cases_languages_and_marks(self):
        self.client.force_authenticate(self.teacher)
        missing_hidden = self.payload(test_cases=[self.payload()['test_cases'][0]])
        self.assertEqual(self.client.post('/api/coding/questions/', missing_hidden, format='json').status_code, 400)
        invalid_language = self.client.post(
            '/api/coding/questions/', self.payload(allowed_languages=['ruby']), format='json',
        )
        self.assertEqual(invalid_language.status_code, 400)
        invalid_marks = self.payload()
        invalid_marks['test_cases'][0]['marks'] = 0
        self.assertEqual(self.client.post('/api/coding/questions/', invalid_marks, format='json').status_code, 400)

    def test_teacher_owns_detail_and_test_question_list(self):
        question = self.create_question()
        other_question = self.create_question(test=self.other_test)
        # Teacher list and test-scoped list include only this teacher's coding questions.
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.get('/api/coding/questions/').status_code, 200)
        own_list = self.client.get('/api/coding/questions/')
        self.assertEqual([row['id'] for row in own_list.data], [question.id])
        own_test_list = self.client.get(f'/api/coding/tests/{self.test.id}/questions/')
        self.assertEqual(own_test_list.status_code, 200)
        self.assertEqual(own_test_list.data, [{'id': question.id, 'title': question.title, 'max_marks': 10, 'order': 0}])

        self.client.force_authenticate(self.other_teacher)
        self.assertEqual(self.client.get(f'/api/coding/questions/{question.id}/').status_code, 404)
        self.assertEqual(self.client.patch(f'/api/coding/questions/{question.id}/', {'title': 'Changed'}).status_code, 404)
        self.assertEqual(self.client.get(f'/api/coding/tests/{self.test.id}/questions/').status_code, 404)
        self.assertEqual(self.client.get('/api/coding/questions/').data[0]['id'], other_question.id)

    def test_patch_cannot_move_question_or_change_locked_fields_after_submission(self):
        question = self.create_question()
        self.add_cases(question)
        self.client.force_authenticate(self.teacher)
        moved = self.client.patch(f'/api/coding/questions/{question.id}/', {'test_id': self.other_test.id}, format='json')
        self.assertEqual(moved.status_code, 400)
        self.create_submission(question)
        for field, value in (
            ('test_cases', [
                {'input': '4', 'expected_output': '4', 'is_hidden': False, 'marks': 1},
                {'input': '9', 'expected_output': '9', 'is_hidden': True, 'marks': 1},
            ]),
            ('max_marks', 11),
            ('allowed_languages', ['javascript']),
        ):
            response = self.client.patch(
                f'/api/coding/questions/{question.id}/', {field: value}, format='json',
            )
            self.assertEqual(response.status_code, 409, response.data)
            self.assertIn('cannot be changed', response.data['detail'])
        allowed = self.client.patch(
            f'/api/coding/questions/{question.id}/',
            {'title': 'Renamed', 'statement': 'Updated statement', 'constraints': 'New constraints',
             'starter_code': {'python': 'print(2)'}, 'is_published': False},
            format='json',
        )
        self.assertEqual(allowed.status_code, 200, allowed.data)

    def test_teacher_case_limit_and_students_cannot_create_or_patch(self):
        self.client.force_authenticate(self.teacher)
        many_cases = [
            {'input': str(index), 'expected_output': str(index), 'is_hidden': index > 0, 'marks': 1}
            for index in range(51)
        ]
        too_many = self.client.post('/api/coding/questions/', self.payload(test_cases=many_cases), format='json')
        self.assertEqual(too_many.status_code, 400)
        question = self.create_question()
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.post('/api/coding/questions/', self.payload(), format='json').status_code, 403)
        self.assertEqual(
            self.client.patch(f'/api/coding/questions/{question.id}/', {'title': 'Student edit'}).status_code,
            403,
        )

    def test_student_detail_omits_hidden_expected_output_and_unassigned_denied(self):
        question = self.create_question()
        self.add_cases(question)
        self.client.force_authenticate(self.student)
        response = self.client.get(f'/api/coding/questions/{question.id}/')
        self.assertEqual(response.status_code, 200, response.data)
        body = response.content.decode()
        self.assertIn('5', body)
        self.assertNotIn('SECRET-EXPECTED-17', body)
        self.assertEqual(len(response.data['test_cases']), 1)

        self.client.force_authenticate(self.unassigned_student)
        self.assertEqual(self.client.get(f'/api/coding/questions/{question.id}/').status_code, 404)
        self.assertEqual(self.client.get(f'/api/coding/tests/{self.test.id}/questions/').status_code, 404)

    def test_grading_cases_returns_hash_for_hidden_only_and_rejects_expired_attempt(self):
        question = self.create_question()
        visible, hidden = self.add_cases(question)
        attempt = TestAttempt.objects.create(test=self.test, student=self.student)
        self.client.force_authenticate(self.student)
        url = f'/api/coding/questions/{question.id}/grading-cases/?attempt_id={attempt.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200, response.data)
        body = response.content.decode()
        self.assertNotIn('SECRET-EXPECTED-17', body)
        self.assertEqual(response.data[0]['expected_output'], visible.expected_output)
        self.assertEqual(response.data[1]['expected_hash'], sha256_hex(normalize_output(hidden.expected_output)))
        self.assertNotIn('expected_output', response.data[1])

        attempt.started_at = timezone.now() - timedelta(minutes=31)
        attempt.save(update_fields=['started_at'])
        self.assertEqual(self.client.get(url).status_code, 400)

    def test_students_cannot_view_unpublished_question_or_unpublished_test(self):
        question = self.create_question()
        self.add_cases(question)
        self.client.force_authenticate(self.student)
        question.is_published = False
        question.save(update_fields=['is_published'])
        self.assertEqual(self.client.get(f'/api/coding/questions/{question.id}/').status_code, 404)
        question.is_published = True
        question.save(update_fields=['is_published'])
        self.test.is_published = False
        self.test.save(update_fields=['is_published'])
        self.assertEqual(self.client.get(f'/api/coding/questions/{question.id}/').status_code, 404)
        self.assertEqual(self.client.get(f'/api/coding/tests/{self.test.id}/questions/').status_code, 404)

    def test_grading_cases_reject_another_students_different_test_and_inactive_attempts(self):
        question = self.create_question()
        self.add_cases(question)
        sibling_test = AssessmentTest.objects.create(title='Sibling', created_by=self.teacher)
        self.client.force_authenticate(self.student)
        foreign_attempt = TestAttempt.objects.create(test=self.test, student=self.unassigned_student)
        url = f'/api/coding/questions/{question.id}/grading-cases/'
        self.assertEqual(self.client.get(f'{url}?attempt_id={foreign_attempt.id}').status_code, 400)
        other_test_attempt = TestAttempt.objects.create(test=sibling_test, student=self.student)
        self.assertEqual(self.client.get(f'{url}?attempt_id={other_test_attempt.id}').status_code, 403)
        for inactive_status in (AttemptStatus.SUBMITTED, AttemptStatus.TERMINATED):
            inactive = TestAttempt.objects.create(test=self.test, student=self.student, status=inactive_status)
            self.assertEqual(self.client.get(f'{url}?attempt_id={inactive.id}').status_code, 400)

    def submission_payload(self, question, attempt, results=None, **extra):
        cases = list(question.test_cases.order_by('order', 'id'))
        results = results or [
            {'case_id': case.id, 'passed': True, 'status': 'ok'} for case in cases
        ]
        payload = {
            'question_id': question.id,
            'attempt_id': attempt.id,
            'language': 'python',
            'source_code': 'print(1)',
            'case_results': results,
        }
        payload.update(extra)
        return payload

    def test_submission_statuses_weighted_score_and_hidden_data_safety(self):
        question = self.create_question()
        _visible, hidden = self.add_cases(question)
        attempt = TestAttempt.objects.create(test=self.test, student=self.student)
        self.client.force_authenticate(self.student)

        accepted = self.client.post(
            '/api/coding/submissions/', self.submission_payload(question, attempt, score=9999), format='json',
        )
        self.assertEqual(accepted.status_code, 201, accepted.data)
        self.assertEqual(accepted.data['status'], 'accepted')
        self.assertEqual(accepted.data['score'], 10)
        self.assertEqual(accepted.data['max_score'], 10)
        self.assertEqual(accepted.data['passed'], 2)
        self.assertNotIn('SECRET-EXPECTED-17', accepted.content.decode())
        self.assertNotIn('expected_output', accepted.data)
        self.assertNotIn('case_id', accepted.data['cases'][0])

        cases = list(question.test_cases.order_by('order', 'id'))
        partial = self.client.post(
            '/api/coding/submissions/',
            self.submission_payload(question, attempt, [
                {'case_id': cases[0].id, 'passed': True, 'status': 'ok'},
                {'case_id': cases[1].id, 'passed': False, 'status': 'wrong'},
            ]),
            format='json',
        )
        self.assertEqual(partial.status_code, 201, partial.data)
        self.assertEqual(partial.data['status'], 'partial')
        self.assertEqual(partial.data['score'], 2)

        for statuses, expected in (
            (['wrong', 'wrong'], 'wrong'),
            (['runtime_error', 'wrong'], 'runtime_error'),
            (['runtime_error', 'timeout'], 'timeout'),
        ):
            results = [
                {'case_id': case.id, 'passed': False, 'status': case_status}
                for case, case_status in zip(cases, statuses)
            ]
            response = self.client.post(
                '/api/coding/submissions/', self.submission_payload(question, attempt, results), format='json',
            )
            self.assertEqual(response.status_code, 201, response.data)
            self.assertEqual(response.data['status'], expected)

        stored = CodingSubmission.objects.filter(question=question, attempt=attempt).order_by('-created_at', '-id').first()
        self.assertEqual(stored.graded_by, 'browser')
        self.assertEqual(stored.status, CodingSubmission.Status.TIMEOUT)
        self.assertEqual(stored.case_results[0]['case_id'], cases[0].id)

    def test_submission_rejects_invalid_case_sets_and_inconsistent_pass_status(self):
        question = self.create_question()
        self.add_cases(question)
        attempt = TestAttempt.objects.create(test=self.test, student=self.student)
        self.client.force_authenticate(self.student)
        base = self.submission_payload(question, attempt)
        unknown = dict(base)
        unknown['case_results'] = [
            dict(base['case_results'][0], case_id=999999), base['case_results'][1],
        ]
        duplicate = dict(base)
        duplicate['case_results'] = [base['case_results'][0], base['case_results'][0]]
        missing = dict(base)
        missing['case_results'] = base['case_results'][:1]
        inconsistent = dict(base)
        inconsistent['case_results'] = [dict(base['case_results'][0], status='runtime_error'), base['case_results'][1]]
        for payload in (unknown, duplicate, missing, inconsistent):
            response = self.client.post('/api/coding/submissions/', payload, format='json')
            self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(CodingSubmission.objects.exists())

    def test_submissions_reject_other_student_different_test_inactive_and_expired_attempts(self):
        question = self.create_question()
        self.add_cases(question)
        self.client.force_authenticate(self.student)
        other_student = TestAttempt.objects.create(test=self.test, student=self.unassigned_student)
        self.assertEqual(
            self.client.post('/api/coding/submissions/', self.submission_payload(question, other_student), format='json').status_code,
            400,
        )
        sibling_test = AssessmentTest.objects.create(title='Sibling', created_by=self.teacher)
        wrong_test_attempt = TestAttempt.objects.create(test=sibling_test, student=self.student)
        self.assertEqual(
            self.client.post('/api/coding/submissions/', self.submission_payload(question, wrong_test_attempt), format='json').status_code,
            400,
        )
        for inactive_status in (AttemptStatus.SUBMITTED, AttemptStatus.TERMINATED):
            inactive = TestAttempt.objects.create(test=self.test, student=self.student, status=inactive_status)
            self.assertEqual(
                self.client.post('/api/coding/submissions/', self.submission_payload(question, inactive), format='json').status_code,
                400,
            )
        expired = TestAttempt.objects.create(test=self.test, student=self.student)
        expired.started_at = timezone.now() - timedelta(minutes=31)
        expired.save(update_fields=['started_at'])
        self.assertEqual(
            self.client.post('/api/coding/submissions/', self.submission_payload(question, expired), format='json').status_code,
            400,
        )

    def test_submission_requires_published_question_and_test_and_allows_grace_period(self):
        question = self.create_question()
        self.add_cases(question)
        attempt = TestAttempt.objects.create(test=self.test, student=self.student)
        self.client.force_authenticate(self.student)
        question.is_published = False
        question.save(update_fields=['is_published'])
        self.assertEqual(
            self.client.post('/api/coding/submissions/', self.submission_payload(question, attempt), format='json').status_code,
            400,
        )
        question.is_published = True
        question.save(update_fields=['is_published'])
        self.test.is_published = False
        self.test.save(update_fields=['is_published'])
        self.assertEqual(
            self.client.post('/api/coding/submissions/', self.submission_payload(question, attempt), format='json').status_code,
            400,
        )
        self.test.is_published = True
        self.test.save(update_fields=['is_published'])
        attempt.started_at = timezone.now() - timedelta(minutes=30, seconds=20)
        attempt.save(update_fields=['started_at'])
        grace = self.client.post(
            '/api/coding/submissions/', self.submission_payload(question, attempt), format='json',
        )
        self.assertEqual(grace.status_code, 201, grace.data)

    def test_score_calculation_adds_latest_coding_score_without_changing_mcq_totals(self):
        question = self.create_question()
        question.max_marks = 7
        question.save(update_fields=['max_marks'])
        CodingTestCase.objects.create(
            question=question, input_data='a', expected_output='a', is_hidden=False, marks=1, order=0,
        )
        CodingTestCase.objects.create(
            question=question, input_data='b', expected_output='b', is_hidden=True, marks=2, order=1,
        )
        attempt = TestAttempt.objects.create(test=self.test, student=self.student)
        self.client.force_authenticate(self.student)
        results = [
            {'case_id': case.id, 'passed': True, 'status': 'ok'}
            for case in question.test_cases.order_by('order')
        ]
        first = self.client.post(
            '/api/coding/submissions/', self.submission_payload(question, attempt, results), format='json',
        )
        self.assertEqual(first.data['score'], 7)
        results[0]['passed'] = True
        results[1]['passed'] = False
        results[1]['status'] = 'wrong'
        latest = self.client.post(
            '/api/coding/submissions/', self.submission_payload(question, attempt, results), format='json',
        )
        self.assertEqual(latest.data['score'], 7 / 3)

        mcq = Question.objects.create(test=self.test, text='One plus one?', question_type=QuestionType.MCQ, marks=3)
        correct = Option.objects.create(question=mcq, text='2', is_correct=True)
        AttemptResponse.objects.create(attempt=attempt, question=mcq, selected_option=correct)
        unpublished = self.create_question()
        unpublished.is_published = False
        unpublished.max_marks = 100
        unpublished.save(update_fields=['is_published', 'max_marks'])

        scoring = calculate_attempt_scores(attempt)
        self.assertEqual(scoring['score'], 3 + 7 / 3)
        self.assertEqual(scoring['max_score'], 3 + 7)
        self.assertEqual(scoring['correct_answers'], 1)
        self.assertEqual(scoring['total_questions'], 1)
        self.assertIsInstance(Result._meta.get_field('score'), FloatField)
        self.assertIsInstance(Result._meta.get_field('max_score'), FloatField)
