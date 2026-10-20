# API CONTRACT - STAGE 1

## Auth
POST /api/auth/login/
Request: { "email": "string", "password": "string" }
Response: { "access": "string", "refresh": "string", "user": { "id": 1, "role": "STUDENT|TEACHER|ADMIN", "email": "string" } }

## Student Tests
GET /api/tests/ (Headers: Authorization Bearer <token>)
Response: [ { "id": 1, "title": "Math Quiz", "description": "Basic Algebra", "duration_minutes": 30, "total_questions": 10 } ]

GET /api/tests/<id>/ (Headers: Authorization Bearer <token>)
Response: { "id": 1, "title": "Math Quiz", "duration_minutes": 30, "questions": [ { "id": 101, "text": "What is 2+2?", "options": [ { "id": 1, "text": "3" }, { "id": 2, "text": "4" } ] } ] }

POST /api/tests/<id>/submit/ (Headers: Authorization Bearer <token>)
Request: { "time_taken_seconds": 600, "answers": [ { "question_id": 101, "selected_option_id": 2 } ] }
Response: { "submission_id": 55, "score": 10, "total_marks": 10, "percentage": 100.0, "passed": true }

GET /api/submissions/<submission_id>/result/ (Headers: Authorization Bearer <token>)
Response: { "submission_id": 55, "test_title": "Math Quiz", "score": 10, "total_marks": 10, "percentage": 100.0, "time_taken_seconds": 600, "details": [ { "question_id": 101, "question_text": "What is 2+2?", "user_selected_option_id": 2, "correct_option_id": 2, "is_correct": true } ] }