from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient, APIRequestFactory

from apps.evaluations.models import AttemptStatus, Response, TestAttempt
from apps.evaluations.scoring import calculate_attempt_scores
from apps.tests.models import Option, Question, QuestionType, Subject, Test
from apps.tests.serializers import QuestionSerializer, StudentTestSerializer, TestSerializer
from apps.users.models import TeacherStudentMapping

User = get_user_model()


class SubjectiveAndMCQQuestionTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher1',
            email='teacher@example.com',
            password='password123',
            role='EVALUATOR',
            first_name='Priya',
            last_name='Natarajan',
        )
        self.student = User.objects.create_user(
            username='student1',
            email='student@example.com',
            password='password123',
            role='STUDENT',
            first_name='Aarav',
            last_name='Sharma',
        )

    def test_create_mixed_test_via_serializer(self):
        factory = APIRequestFactory()
        request = factory.post('/api/tests/')
        request.user = self.teacher

        test_data = {
            'title': 'Midterm Exam: Data Structures',
            'description': 'Comprehensive assessment with MCQ and Subjective items',
            'duration_minutes': 45,
            'questions': [
                {
                    'text': 'Which traversal visits left, root, right?',
                    'question_type': 'MCQ',
                    'marks': 2,
                    'order': 1,
                    'options': [
                        {'text': 'Preorder', 'is_correct': False},
                        {'text': 'Inorder', 'is_correct': True},
                    ],
                },
                {
                    'text': 'Explain the difference between Stack and Queue.',
                    'question_type': 'subjective',
                    'marks': 5,
                    'model_answer': 'Stack is LIFO and Queue is FIFO.',
                    'order': 2,
                    'options': [],
                },
            ],
        }

        serializer = TestSerializer(data=test_data, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        test = serializer.save()

        self.assertEqual(test.questions.count(), 2)
        q1 = test.questions.get(order=1)
        q2 = test.questions.get(order=2)

        self.assertEqual(q1.question_type, QuestionType.MCQ)
        self.assertEqual(q1.options.count(), 2)
        self.assertEqual(q2.question_type, QuestionType.DESCRIPTIVE)
        self.assertEqual(q2.model_answer, 'Stack is LIFO and Queue is FIFO.')
        self.assertEqual(q2.options.count(), 0)

    def test_student_test_serializer_hides_correctness(self):
        test = Test.objects.create(
            title='Sample Test',
            created_by=self.teacher,
            duration_minutes=30,
        )
        q_mcq = Question.objects.create(
            test=test,
            text='What is 2+2?',
            question_type=QuestionType.MCQ,
            marks=2,
            order=1,
        )
        opt1 = Option.objects.create(question=q_mcq, text='3', is_correct=False)
        opt2 = Option.objects.create(question=q_mcq, text='4', is_correct=True)

        q_subj = Question.objects.create(
            test=test,
            text='Explain binary search.',
            question_type=QuestionType.DESCRIPTIVE,
            marks=5,
            model_answer='Divide search interval in half repeatedly.',
            order=2,
        )

        serializer = StudentTestSerializer(test)
        data = serializer.data
        self.assertEqual(len(data['questions']), 2)
        mcq_serialized = data['questions'][0]
        self.assertNotIn('is_correct', mcq_serialized['options'][0])
        self.assertNotIn('model_answer', mcq_serialized)

    def test_teacher_can_edit_own_published_test_but_not_another_teachers(self):
        other_teacher = User.objects.create_user(
            username='teacher2', email='teacher2@example.com', password='password123', role='TEACHER'
        )
        own_test = Test.objects.create(title='Original', created_by=self.teacher, is_published=True)
        other_test = Test.objects.create(title='Protected', created_by=other_teacher, is_published=True)

        self.client = APIClient()
        self.client.force_authenticate(user=self.teacher)
        updated = self.client.patch(
            f'/api/tests/{own_test.id}/', {'title': 'Updated published test'}, format='json'
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        own_test.refresh_from_db()
        self.assertEqual(own_test.title, 'Updated published test')

        forbidden = self.client.patch(
            f'/api/tests/{other_test.id}/', {'title': 'Attempted edit'}, format='json'
        )
        self.assertEqual(forbidden.status_code, 404)
        other_test.refresh_from_db()
        self.assertEqual(other_test.title, 'Protected')

    def test_evaluation_and_scoring_mixed_test(self):
        test = Test.objects.create(
            title='DSA Quiz',
            created_by=self.teacher,
            duration_minutes=30,
        )
        q_mcq = Question.objects.create(
            test=test,
            text='Pick the odd one out.',
            question_type=QuestionType.MCQ,
            marks=2,
            order=1,
        )
        Option.objects.create(question=q_mcq, text='Incorrect', is_correct=False)
        correct_opt = Option.objects.create(question=q_mcq, text='Correct', is_correct=True)

        q_subj = Question.objects.create(
            test=test,
            text='What is recursion?',
            question_type=QuestionType.DESCRIPTIVE,
            marks=5,
            model_answer='A function calling itself.',
            order=2,
        )

        attempt = TestAttempt.objects.create(
            test=test,
            student=self.student,
            status=AttemptStatus.SUBMITTED,
        )

        # MCQ response
        Response.objects.create(
            attempt=attempt,
            question=q_mcq,
            selected_option=correct_opt,
        )
        # Subjective response
        subj_resp = Response.objects.create(
            attempt=attempt,
            question=q_subj,
            descriptive_text='Recursion is when a function calls itself directly or indirectly.',
        )

        # Before grading subjective question
        scores_before = calculate_attempt_scores(attempt)
        self.assertEqual(scores_before['score'], 2.0)
        self.assertEqual(scores_before['max_score'], 7.0)

        # Teacher grades subjective question
        subj_resp.awarded_marks = 4.5
        subj_resp.feedback = 'Well explained with base case implicit.'
        subj_resp.graded_by = self.teacher
        subj_resp.save()

        # After grading subjective question
        scores_after = calculate_attempt_scores(attempt)
        self.assertEqual(scores_after['score'], 6.5)
        self.assertEqual(scores_after['max_score'], 7.0)


class SubjectTeacherStudentRelationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin1',
            email='admin@example.com',
            password='password123',
        )
        self.teacher_dsa = User.objects.create_user(
            username='teacher_dsa',
            email='dsa_teacher@example.com',
            password='password123',
            role='EVALUATOR',
            first_name='Priya',
            last_name='Natarajan',
        )
        self.teacher_math = User.objects.create_user(
            username='teacher_math',
            email='math_teacher@example.com',
            password='password123',
            role='EVALUATOR',
            first_name='Rajesh',
            last_name='Kapoor',
        )
        self.student_cs = User.objects.create_user(
            username='student_cs',
            email='cs_student@example.com',
            password='password123',
            role='STUDENT',
            first_name='Aarav',
            last_name='Sharma',
        )
        self.student_ee = User.objects.create_user(
            username='student_ee',
            email='ee_student@example.com',
            password='password123',
            role='STUDENT',
            first_name='Arjun',
            last_name='Nair',
        )

        # Create Subjects
        self.sub_dsa = Subject.objects.create(
            name='Data Structures & Algorithms',
            code='CS-301',
            department='Computer Science',
        )
        self.sub_math = Subject.objects.create(
            name='Discrete Mathematics',
            code='MA-201',
            department='Mathematics',
        )

        # Assign Teachers to Subjects
        self.sub_dsa.teachers.add(self.teacher_dsa)
        self.sub_math.teachers.add(self.teacher_math)

        # Enroll Students in Subjects:
        # student_cs enrolled in both DSA & Math
        self.sub_dsa.students.add(self.student_cs)
        self.sub_math.students.add(self.student_cs)
        # student_ee enrolled ONLY in Math
        self.sub_math.students.add(self.student_ee)

        # Test access follows the persistent teacher assignment, not subject
        # enrollment (which may legitimately overlap between teachers).
        TeacherStudentMapping.objects.create(student=self.student_cs, teacher=self.teacher_dsa)
        TeacherStudentMapping.objects.create(student=self.student_ee, teacher=self.teacher_math)

        # Create Tests
        self.test_dsa = Test.objects.create(
            title='DSA Midterm Exam',
            subject=self.sub_dsa,
            created_by=self.teacher_dsa,
            duration_minutes=60,
        )
        self.test_math = Test.objects.create(
            title='Math Midterm Exam',
            subject=self.sub_math,
            created_by=self.teacher_math,
            duration_minutes=90,
        )

    def test_student_test_listing_filters_by_assigned_teacher(self):
        # student_cs is enrolled in two subjects, but is assigned to DSA only.
        self.client.force_authenticate(user=self.student_cs)
        res_cs = self.client.get('/api/tests/')
        self.assertEqual(res_cs.status_code, 200)
        self.assertEqual(len(res_cs.data), 1)
        test_titles = [t['title'] for t in res_cs.data]
        self.assertIn('DSA Midterm Exam', test_titles)
        self.assertNotIn('Math Midterm Exam', test_titles)

        # student_ee is only enrolled in MA-201 -> sees ONLY Math test
        self.client.force_authenticate(user=self.student_ee)
        res_ee = self.client.get('/api/tests/')
        self.assertEqual(res_ee.status_code, 200)
        self.assertEqual(len(res_ee.data), 1)
        self.assertEqual(res_ee.data[0]['title'], 'Math Midterm Exam')
        self.assertEqual(res_ee.data[0]['subject_code'], 'MA-201')
        self.assertEqual(res_ee.data[0]['teacher_name'], 'Rajesh Kapoor')

    def test_student_detail_view_permissions(self):
        # student_cs can access DSA test
        self.client.force_authenticate(user=self.student_cs)
        res1 = self.client.get(f'/api/tests/{self.test_dsa.id}/student/')
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.data['subject_name'], 'Data Structures & Algorithms')
        self.assertEqual(res1.data['teacher_name'], 'Priya Natarajan')

        # student_ee CANNOT access DSA test because not enrolled in CS-301
        self.client.force_authenticate(user=self.student_ee)
        res2 = self.client.get(f'/api/tests/{self.test_dsa.id}/student/')
        self.assertEqual(res2.status_code, 404)

    def test_teacher_auto_tags_subject_if_single_subject(self):
        factory = APIRequestFactory()
        request = factory.post('/api/tests/')
        request.user = self.teacher_dsa

        test_data = {
            'title': 'DSA Quiz 2',
            'duration_minutes': 30,
            'questions': [],
        }
        serializer = TestSerializer(data=test_data, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        test = serializer.save()

        self.assertEqual(test.subject, self.sub_dsa)
        self.assertEqual(test.created_by, self.teacher_dsa)

    def test_admin_assign_subject_and_enroll_student_endpoints(self):
        new_sub = Subject.objects.create(
            name='Operating Systems',
            code='CS-303',
            department='Computer Science',
        )

        self.client.force_authenticate(user=self.admin)

        # Admin assigns OS subject to teacher_dsa
        res_assign = self.client.post(
            f'/api/users/teachers/{self.teacher_dsa.id}/assign-subject/',
            {'subject_id': new_sub.id},
            format='json',
        )
        self.assertEqual(res_assign.status_code, 200)
        self.assertTrue(self.teacher_dsa.teaching_subjects.filter(id=new_sub.id).exists())

        # Admin enrolls student_ee in OS subject
        res_enroll = self.client.post(
            f'/api/users/students/{self.student_ee.id}/enroll/',
            {'subject_id': new_sub.id},
            format='json',
        )
        self.assertEqual(res_enroll.status_code, 200)
        self.assertTrue(self.student_ee.enrolled_subjects.filter(id=new_sub.id).exists())
