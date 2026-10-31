from datetime import timedelta

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from apps.evaluations.models import TestAttempt
from apps.tests.models import Test as AssessmentTest
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
        self.client.force_authenticate(self.other_teacher)
        self.assertEqual(self.client.get(f'/api/coding/questions/{question.id}/').status_code, 404)
        self.assertEqual(self.client.patch(f'/api/coding/questions/{question.id}/', {'title': 'Changed'}).status_code, 404)
        self.assertEqual(self.client.get(f'/api/coding/tests/{self.test.id}/questions/').status_code, 404)

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
