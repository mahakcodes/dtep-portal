from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.evaluations.models import AttemptStatus, Response, TestAttempt
from apps.results.models import Result
from apps.users.models import TeacherStudentMapping
from apps.tests.models import Option, Question, QuestionType, Subject, Test

User = get_user_model()


class AdminTeacherStudentLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin1',
            email='admin@example.com',
            password='AdminPass123',
        )
        self.subject = Subject.objects.create(
            name='Data Structures & Algorithms',
            code='CS-301',
            department='Computer Science',
        )
        self.other_subject = Subject.objects.create(
            name='Discrete Mathematics',
            code='MA-201',
            department='Mathematics',
        )

    def test_admin_creates_teacher_with_hashed_password_and_subject(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            '/api/users/teachers/',
            {
                'username': 'teacher_dsa',
                'email': 'teacher.dsa@dtep.edu',
                'password': 'TeacherPass123',
                'first_name': 'Priya',
                'last_name': 'Natarajan',
                'subject_ids': [self.subject.id],
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        teacher = User.objects.get(username='teacher_dsa')
        self.assertEqual(teacher.role, 'TEACHER')
        self.assertTrue(teacher.check_password('TeacherPass123'))
        self.assertNotEqual(teacher.password, 'TeacherPass123')
        self.assertTrue(teacher.teaching_subjects.filter(id=self.subject.id).exists())
        self.assertEqual(res.data['role'], 'TEACHER')

    def test_teacher_login_returns_teacher_role(self):
        teacher = User.objects.create_user(
            username='teacher_dsa',
            email='teacher.dsa@dtep.edu',
            password='TeacherPass123',
            role='TEACHER',
        )
        teacher.teaching_subjects.add(self.subject)

        res = self.client.post(
            '/api/users/login/',
            {'username': 'teacher_dsa', 'password': 'TeacherPass123'},
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['role'], 'TEACHER')
        self.assertIn('access', res.data)
        self.assertEqual(res.data['username'], 'teacher_dsa')

        by_email = self.client.post(
            '/api/auth/login/',
            {'username': 'teacher.dsa@dtep.edu', 'password': 'TeacherPass123'},
            format='json',
        )
        self.assertEqual(by_email.status_code, 200)
        self.assertEqual(by_email.data['role'], 'TEACHER')

    def test_teacher_test_binds_assigned_subject_and_rejects_other(self):
        teacher = User.objects.create_user(
            username='teacher_dsa',
            email='teacher.dsa@dtep.edu',
            password='TeacherPass123',
            role='EVALUATOR',
        )
        teacher.teaching_subjects.add(self.subject)
        self.client.force_authenticate(user=teacher)

        auto = self.client.post(
            '/api/tests/',
            {'title': 'DSA Quiz', 'duration_minutes': 30, 'questions': []},
            format='json',
        )
        self.assertEqual(auto.status_code, 201, auto.data)
        self.assertEqual(auto.data['subject_id'], self.subject.id)

        rejected = self.client.post(
            '/api/tests/',
            {'title': 'Math Quiz', 'subject': self.other_subject.id, 'duration_minutes': 20, 'questions': []},
            format='json',
        )
        self.assertEqual(rejected.status_code, 400)

    def test_student_sees_only_enrolled_subject_tests_and_teacher_sees_own_submissions(self):
        teacher = User.objects.create_user(
            username='teacher_dsa',
            email='teacher.dsa@dtep.edu',
            password='TeacherPass123',
            role='EVALUATOR',
            first_name='Priya',
            last_name='Natarajan',
        )
        other_teacher = User.objects.create_user(
            username='teacher_math',
            email='teacher.math@dtep.edu',
            password='TeacherPass123',
            role='EVALUATOR',
        )
        teacher.teaching_subjects.add(self.subject)
        other_teacher.teaching_subjects.add(self.other_subject)

        self.client.force_authenticate(user=self.admin)
        student_res = self.client.post(
            '/api/users/students/',
            {
                'username': 'stu_aarav',
                'email': 'aarav@dtep.edu',
                'password': 'StudentPass123',
                'first_name': 'Aarav',
                'last_name': 'Sharma',
                'subject_ids': [self.subject.id],
            },
            format='json',
        )
        self.assertEqual(student_res.status_code, 201, student_res.data)
        student = User.objects.get(username='stu_aarav')
        TeacherStudentMapping.objects.create(student=student, teacher=teacher)

        dsa_test = Test.objects.create(title='DSA Midterm', subject=self.subject, created_by=teacher, duration_minutes=45)
        math_test = Test.objects.create(title='Math Midterm', subject=self.other_subject, created_by=other_teacher, duration_minutes=45)

        self.client.force_authenticate(user=student)
        listing = self.client.get('/api/tests/')
        self.assertEqual(listing.status_code, 200)
        titles = [item['title'] for item in listing.data]
        self.assertEqual(titles, ['DSA Midterm'])

        blocked = self.client.get(f'/api/tests/{math_test.id}/')
        self.assertEqual(blocked.status_code, 404)

        start = self.client.post('/api/evaluations/start/', {'test_id': dsa_test.id}, format='json')
        self.assertEqual(start.status_code, 201, start.data)
        submit = self.client.post('/api/evaluations/submit/', {'attempt_id': start.data['id']}, format='json')
        self.assertEqual(submit.status_code, 200, submit.data)

        other_start = self.client.post('/api/evaluations/start/', {'test_id': math_test.id}, format='json')
        self.assertEqual(other_start.status_code, 400)

        self.client.force_authenticate(user=teacher)
        mine = self.client.get('/api/evaluations/submissions/')
        self.assertEqual(mine.status_code, 200)
        self.assertEqual(len(mine.data), 1)
        self.assertEqual(mine.data[0]['student_name'], 'Aarav Sharma')
        self.assertEqual(mine.data[0]['test_title'], 'DSA Midterm')
        self.assertEqual(mine.data[0]['status'], AttemptStatus.SUBMITTED)

        self.client.force_authenticate(user=other_teacher)
        other_list = self.client.get('/api/evaluations/submissions/')
        self.assertEqual(other_list.status_code, 200)
        self.assertEqual(len(other_list.data), 0)

    def test_mapping_reassigns_and_enforces_test_and_result_access(self):
        teacher_x = User.objects.create_user(username='teacher_x', password='TeacherPass123', role='TEACHER')
        teacher_y = User.objects.create_user(username='teacher_y', password='TeacherPass123', role='TEACHER')
        student = User.objects.create_user(username='student_a', password='StudentPass123', role='STUDENT')
        test_x = Test.objects.create(title='Teacher X test', created_by=teacher_x)
        test_y = Test.objects.create(title='Teacher Y test', created_by=teacher_y)

        self.client.force_authenticate(user=self.admin)
        assignment = self.client.post(
            '/api/users/assign-student/',
            {'student_id': student.id, 'teacher_id': teacher_x.id},
            format='json',
        )
        self.assertEqual(assignment.status_code, 201, assignment.data)
        self.assertEqual(TeacherStudentMapping.objects.get(student=student).teacher_id, teacher_x.id)
        self.assertEqual(assignment.data['student']['assigned_teachers'][0]['id'], teacher_x.id)

        self.client.force_authenticate(user=student)
        self.assertEqual(self.client.get('/api/users/profile/').data['assigned_teacher']['id'], teacher_x.id)
        self.assertEqual([t['id'] for t in self.client.get('/api/tests/').data], [test_x.id])
        self.assertEqual(self.client.get(f'/api/tests/{test_y.id}/').status_code, 404)
        self.assertEqual(self.client.post('/api/evaluations/start/', {'test_id': test_y.id}, format='json').status_code, 400)

        attempt = TestAttempt.objects.create(test=test_x, student=student, status=AttemptStatus.SUBMITTED)
        Result.objects.create(attempt=attempt, test=test_x, student=student)
        self.client.force_authenticate(user=teacher_x)
        self.assertEqual(len(self.client.get('/api/evaluations/submissions/').data), 1)
        self.assertEqual(self.client.get(f'/api/results/{attempt.id}/').status_code, 200)

        self.client.force_authenticate(user=self.admin)
        reassignment = self.client.post(
            '/api/users/assign-student/',
            {'student_id': student.id, 'teacher_id': teacher_y.id},
            format='json',
        )
        self.assertEqual(reassignment.status_code, 200, reassignment.data)
        self.assertTrue(reassignment.data['reassigned'])
        self.assertEqual(TeacherStudentMapping.objects.get(student=student).teacher_id, teacher_y.id)

        self.client.force_authenticate(user=teacher_x)
        self.assertEqual(self.client.get('/api/evaluations/submissions/').data, [])
        self.assertEqual(self.client.get(f'/api/results/{attempt.id}/').status_code, 403)
        self.client.force_authenticate(user=student)
        self.assertEqual([t['id'] for t in self.client.get('/api/tests/').data], [test_y.id])
