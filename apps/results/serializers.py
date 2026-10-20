from rest_framework import serializers

from .models import Result


class ResultSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True)
    details = serializers.SerializerMethodField()

    student_name = serializers.SerializerMethodField()

    submission_id = serializers.IntegerField(source='attempt_id', read_only=True)
    total_marks = serializers.FloatField(source='max_score', read_only=True)
    time_taken_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = (
            'id',
            'attempt',
            'submission_id',
            'test',
            'test_title',
            'student',
            'student_name',
            'score',
            'max_score',
            'total_marks',
            'percentage',
            'correct_answers',
            'total_questions',
            'time_taken_seconds',
            'calculated_at',
            'details',
        )
        read_only_fields = fields

    def get_time_taken_seconds(self, obj):
        if obj.attempt and obj.attempt.submitted_at and obj.attempt.started_at:
            return int((obj.attempt.submitted_at - obj.attempt.started_at).total_seconds())
        return 0

    def get_student_name(self, obj):
        name = f'{obj.student.first_name} {obj.student.last_name}'.strip()
        return name or obj.student.username

    def get_details(self, obj):
        attempt = obj.attempt
        if not attempt:
            return []
        questions = attempt.test.questions.prefetch_related('options').all()
        responses = {r.question_id: r for r in attempt.responses.select_related('selected_option').all()}

        detail_list = []
        for q in questions:
            resp = responses.get(q.id)
            if q.question_type == 'MCQ':
                correct_opt = next((opt for opt in q.options.all() if opt.is_correct), None)
                sel_opt = resp.selected_option if resp else None
                is_correct = sel_opt.is_correct if sel_opt else False
                detail_list.append({
                    'question_id': q.id,
                    'question_text': q.text,
                    'question_type': 'MCQ',
                    'marks': q.marks,
                    'model_answer': q.model_answer,
                    'user_selected_option_id': sel_opt.id if sel_opt else None,
                    'selected_option_text': sel_opt.text if sel_opt else None,
                    'correct_option_id': correct_opt.id if correct_opt else None,
                    'correct_option_text': correct_opt.text if correct_opt else None,
                    'is_correct': is_correct,
                    'user_descriptive_text': '',
                    'awarded_marks': q.marks if is_correct else 0,
                    'feedback': '',
                })
            else:
                detail_list.append({
                    'question_id': q.id,
                    'question_text': q.text,
                    'question_type': 'DESCRIPTIVE',
                    'marks': q.marks,
                    'model_answer': q.model_answer,
                    'user_selected_option_id': None,
                    'selected_option_text': None,
                    'correct_option_id': None,
                    'correct_option_text': None,
                    'is_correct': (resp.awarded_marks is not None and resp.awarded_marks > 0) if resp else None,
                    'user_descriptive_text': resp.descriptive_text if resp else '',
                    'awarded_marks': resp.awarded_marks if resp else None,
                    'feedback': resp.feedback if resp else '',
                })
        return detail_list


class LeaderboardEntrySerializer(serializers.Serializer):
    student_name = serializers.CharField()
    email = serializers.EmailField()
    score = serializers.FloatField()
    max_score = serializers.FloatField()
    percentage = serializers.FloatField()
    rank = serializers.IntegerField()
    percentile = serializers.FloatField()
