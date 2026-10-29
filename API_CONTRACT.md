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

## Coding questions (draft, free browser-based grading)

Normalization rule (used by BOTH backend and frontend): replace \r\n with \n,
strip trailing spaces on every line, strip trailing newlines at the end.
Hash = SHA-256 (hex) of the normalized text.

POST /api/coding/questions/ (Teacher)
body: {title, statement, starter_code:{python,javascript}, languages,
marks, test_cases:[{input, expected_output, is_hidden, marks}]}

GET /api/coding/questions/{id}/ (Student)
Returns visible test cases only (input + expected_output). No hidden data.

GET /api/coding/questions/{id}/grading-cases/?attempt_id=... (Student)
Only for the student's own active attempt of an assigned test.
Returns ALL cases: [{id, input, is_hidden, expected_output (visible cases only),
expected_hash (hidden cases only)}]

POST /api/coding/submissions/ (Student)
body: {question_id, attempt_id, language, source_code,
case_results:[{case_id, passed, status}]}
status per case: ok | wrong | runtime_error | timeout
Server validates the attempt and case ids, computes the score itself from
case weights, saves the code and results.
response: {status, score, max_score, passed, total, cases:[{index, passed}]}
