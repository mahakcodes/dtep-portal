from django.db.models import Sum

from apps.tests.models import QuestionType

from .models import Response


def calculate_attempt_scores(attempt):
    questions = list(attempt.test.questions.all())
    mcq_questions = [q for q in questions if q.question_type == QuestionType.MCQ]
    descriptive_questions = [q for q in questions if q.question_type == QuestionType.DESCRIPTIVE]

    max_score = sum(q.marks for q in questions)

    responses_by_question_id = {
        r.question_id: r
        for r in Response.objects.filter(attempt=attempt, question__in=mcq_questions).select_related(
            'selected_option',
            'question',
        )
    }

    correct_answers = 0
    mcq_score = 0
    for q in mcq_questions:
        resp = responses_by_question_id.get(q.id)
        if resp and resp.selected_option and resp.selected_option.is_correct:
            correct_answers += 1
            mcq_score += q.marks

    descriptive_score = (
        Response.objects.filter(
            attempt=attempt,
            question__in=descriptive_questions,
            awarded_marks__isnull=False,
        ).aggregate(total=Sum('awarded_marks'))['total']
        or 0
    )

    score = mcq_score + descriptive_score

    # Coding contributes only while the coding question and its containing test
    # are published. The latest submission for each question is the counted one.
    from apps.coding.models import CodingQuestion, CodingSubmission

    coding_questions = list(CodingQuestion.objects.filter(
        test=attempt.test,
        test__is_published=True,
        is_published=True,
    ))
    coding_max_score = sum(question.max_marks for question in coding_questions)
    latest_by_question = {}
    if coding_questions:
        question_ids = {question.id for question in coding_questions}
        submissions = CodingSubmission.objects.filter(
            attempt=attempt,
            question_id__in=question_ids,
        ).order_by('question_id', '-created_at', '-id')
        for submission in submissions:
            latest_by_question.setdefault(submission.question_id, submission)
    coding_score = sum(submission.score for submission in latest_by_question.values())
    score += coding_score
    max_score += coding_max_score
    percentage = (score / max_score * 100) if max_score else 0.0

    return {
        'score': score,
        'max_score': max_score,
        'percentage': percentage,
        'correct_answers': correct_answers,
        'total_questions': len(mcq_questions),
    }
