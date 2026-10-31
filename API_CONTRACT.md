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

## Coding questions (browser-reported grading)

All endpoints require `Authorization: Bearer <token>`. An unauthenticated request returns `401 Unauthorized`, `{"detail":"Authentication credentials were not provided."}`. “Teacher” includes users with role `TEACHER` or `EVALUATOR`. Allowed languages are `python` and `javascript`. There is no server-side code execution: grading results are reported by the browser and are trust-based. The server validates attempt and case IDs, computes the weighted score from the reported per-case results, and records `graded_by: "browser"`. A student can report passing cases without actually running the code; this is not a secure sandbox judge.

### Create a question

`POST /api/coding/questions/` — Teacher only. The `test_id` is required and must identify a test owned by the requesting teacher. The request must include at least one visible and one hidden case.

Request body:

```json
{
  "test_id": 12,
  "title": "Add two numbers",
  "statement": "Read two integers and print their sum.",
  "constraints": "Integers fit in 32 bits.",
  "starter_code": {"python": "", "javascript": ""},
  "allowed_languages": ["python", "javascript"],
  "max_marks": 10,
  "is_published": true,
  "order": 0,
  "test_cases": [
    {"input": "2 3", "expected_output": "5", "is_hidden": false, "marks": 2},
    {"input": "8 9", "expected_output": "17", "is_hidden": true, "marks": 8}
  ]
}
```

`test_cases[].input` is the exact input field name. Case `order` is not accepted from the client; the server assigns case order from the list position, starting at zero. A question may have at most 50 cases. `allowed_languages` must be a nonempty unique list containing only supported languages. `max_marks` and each case's `marks` must be greater than zero. Field limits: title 255 characters, statement 20,000, constraints 10,000, case input and expected output 10,000 each, and starter code values 100,000 each.

Success: `201 Created`.

```json
{
  "id": 31,
  "test_id": 12,
  "title": "Add two numbers",
  "statement": "Read two integers and print their sum.",
  "constraints": "Integers fit in 32 bits.",
  "starter_code": {"python": "", "javascript": ""},
  "allowed_languages": ["python", "javascript"],
  "max_marks": 10,
  "is_published": true,
  "order": 0,
  "test_cases": [
    {"id": 90, "input": "2 3", "expected_output": "5", "is_hidden": false, "marks": 2},
    {"id": 91, "input": "8 9", "expected_output": "17", "is_hidden": true, "marks": 8}
  ],
  "created_at": "2026-10-31T05:30:00Z",
  "updated_at": "2026-10-31T05:30:00Z"
}
```

Errors: `400 Bad Request` validation errors use field names with arrays of messages, for example `{"test_id":["The test must be owned by you."]}` or `{"test_cases":["Include at least one visible and one hidden case."]}`. Invalid nested case fields are reported under `test_cases` with per-item field errors. A non-teacher gets `403 Forbidden`, `{"detail":"Teacher access is required."}`. Unauthenticated requests get `401 Unauthorized`.

### List a teacher's questions

`GET /api/coding/questions/` — Teacher only; returns only questions owned by the caller, including teacher-visible expected outputs for all cases.

Request body: none. Example request: `GET /api/coding/questions/`.

Success: `200 OK`, an array using the same question fields and nested case fields shown in the create response. A student or other non-teacher gets `403 Forbidden`, `{"detail":"Teacher access is required."}`; unauthenticated requests get `401 Unauthorized`.

Example response:

```json
[{"id":31,"test_id":12,"title":"Add two numbers","statement":"Read two integers and print their sum.","constraints":"Integers fit in 32 bits.","starter_code":{"python":"","javascript":""},"allowed_languages":["python","javascript"],"max_marks":10,"is_published":true,"order":0,"test_cases":[{"id":90,"input":"2 3","expected_output":"5","is_hidden":false,"marks":2},{"id":91,"input":"8 9","expected_output":"17","is_hidden":true,"marks":8}],"created_at":"2026-10-31T05:30:00Z","updated_at":"2026-10-31T05:30:00Z"}]
```

### Get or update a question

`GET /api/coding/questions/{id}/` — The owning teacher, or a student whose assigned teacher owns the test, when both the coding question and its test are published. A teacher receives all cases and expected outputs. A student receives question fields `id`, `test_id`, `title`, `statement`, `constraints`, `starter_code`, `allowed_languages`, `max_marks`, and `test_cases`; student case objects contain `id`, `input`, `expected_output`, `is_hidden`, and `marks`, with visible cases only.

Request body: none. Example request: `GET /api/coding/questions/31/`.

Teacher question fields are `id`, `test_id`, `title`, `statement`, `constraints`, `starter_code`, `allowed_languages`, `max_marks`, `is_published`, `order`, `test_cases`, `created_at`, and `updated_at`. Teacher case objects contain `id`, `input`, `expected_output`, `is_hidden`, and `marks`.

Example student response (`200 OK`):

```json
{
  "id": 31,
  "test_id": 12,
  "title": "Add two numbers",
  "statement": "Read two integers and print their sum.",
  "constraints": "Integers fit in 32 bits.",
  "starter_code": {"python": "", "javascript": ""},
  "allowed_languages": ["python", "javascript"],
  "max_marks": 10,
  "test_cases": [
    {"id": 90, "input": "2 3", "expected_output": "5", "is_hidden": false, "marks": 2}
  ]
}
```

Other GET statuses: `404 Not Found`, `{"detail":"Not found."}` when the question is not owned by that teacher, is unpublished, belongs to an unpublished test, or is unavailable to the student. Authenticated users with roles other than teacher/evaluator or student get `403 Forbidden`, `{"detail":"Student access is required."}`. Unauthenticated requests get `401 Unauthorized`.

`PATCH /api/coding/questions/{id}/` — Owning teacher only. Send only changed fields; supported fields are `title`, `statement`, `constraints`, `starter_code`, `allowed_languages`, `max_marks`, `is_published`, `order`, and `test_cases`. Do not send `test_id`: moving a question to another test is rejected. When `test_cases` is present, it replaces the entire list, must contain at least one visible and one hidden case, and case order is reassigned from list position. After any submission exists for the question, changes to `test_cases`, `max_marks`, or `allowed_languages` are rejected; changes to the other editable fields remain allowed.

Example request: `PATCH /api/coding/questions/31/`

```json
{"title":"Add two values","test_cases":[
  {"input":"2 3","expected_output":"5","is_hidden":false,"marks":2},
  {"input":"8 9","expected_output":"17","is_hidden":true,"marks":8}
]}
```

Success: `200 OK`, the updated question in teacher response shape. Errors: ordinary validation errors return `400 Bad Request` with field-name arrays. Supplying `test_id` returns `400 Bad Request` with the direct response body `{"test_id":"A coding question cannot be moved to another test."}`. If a submission exists and a protected field is supplied, response is `409 Conflict`: `{"detail":"Test cases, max_marks, and allowed_languages cannot be changed after a submission exists."}`. A non-teacher gets `403 Forbidden`, `{"detail":"Teacher access is required."}`; a different teacher requesting the question gets `404 Not Found`, `{"detail":"Not found."}`. Students cannot PATCH questions and receive `403 Forbidden`.

Example response (`200 OK`):

```json
{"id":31,"test_id":12,"title":"Add two values","statement":"Read two integers and print their sum.","constraints":"New constraints","starter_code":{"python":"print(2)"},"allowed_languages":["python","javascript"],"max_marks":10,"is_published":true,"order":0,"test_cases":[{"id":92,"input":"2 3","expected_output":"5","is_hidden":false,"marks":2},{"id":93,"input":"8 9","expected_output":"17","is_hidden":true,"marks":8}],"created_at":"2026-10-31T05:30:00Z","updated_at":"2026-10-31T05:35:00Z"}
```

### List questions for a test

`GET /api/coding/tests/{test_id}/questions/` — Owning teacher, or a student for a published test whose owner is the student's assigned teacher. Teachers see all coding questions for their test. Students see published coding questions only.

Request body: none. Example request: `GET /api/coding/tests/12/questions/`.

Success: `200 OK`:

```json
[{"id":31,"title":"Add two numbers","max_marks":10,"order":0}]
```

Another teacher, an unassigned student, or a student requesting an unpublished test gets `404 Not Found`, `{"detail":"Not found."}`. Other roles get `403 Forbidden` with a `detail` field.

For example, an authenticated admin gets `403 Forbidden`, `{"detail":"You do not have permission to perform this action."}`. Unauthenticated requests get `401 Unauthorized`.

### Get grading cases

`GET /api/coding/questions/{id}/grading-cases/?attempt_id={attempt_id}` — Student only. The question and test must be published and available to the student; the attempt must belong to the student, be active (`IN_PROGRESS` or `STARTED`), be for the question's test, be assigned, and not be expired. `duration_minutes: 0` means no deadline. This endpoint does not apply the submit grace period.

Request body: none. Example request: `GET /api/coding/questions/31/grading-cases/?attempt_id=77`.

Success: `200 OK`:

```json
[
  {"id":90,"input":"2 3","is_hidden":false,"expected_output":"5"},
  {"id":91,"input":"8 9","is_hidden":true,"expected_hash":"<sha256-of-normalized-expected-output>"}
]
```

For a hidden case the response contains its input and `expected_hash`, never its plain `expected_output`. Hashes are lowercase SHA-256 hex of normalized expected output. A missing or invalid attempt ID, another student's attempt, an inactive attempt, or an expired attempt returns `400 Bad Request`, for example `{"attempt_id":["A valid integer is required."]}`, `{"attempt_id":["Attempt has expired."]}`, or `{"attempt_id":["Attempt is not active."]}`. A valid attempt for a different test returns `403 Forbidden`, `{"detail":"This coding question is not part of the attempt."}`. Unpublished, unassigned, or unavailable questions return `404 Not Found`, `{"detail":"Not found."}`. Non-students get `403 Forbidden`, `{"detail":"You do not have permission to perform this action."}`; unauthenticated requests get `401 Unauthorized`.

### Submit code and browser-reported case results

`POST /api/coding/submissions/` — Student only. The coding question and test must be published. The attempt must belong to the student, be active, assigned, and for the question's test. Submission is allowed through 30 seconds after the test deadline; duration zero means no deadline. This endpoint is throttled to 30 requests per minute.

Request body:

```json
{
  "question_id": 31,
  "attempt_id": 77,
  "language": "python",
  "source_code": "print(sum(map(int, input().split())))",
  "case_results": [
    {"case_id": 90, "passed": true, "status": "ok"},
    {"case_id": 91, "passed": false, "status": "wrong"}
  ]
}
```

`source_code` is limited to 100,000 characters. `case_results` must contain exactly one entry for every case ID belonging to the question; unknown, missing, or duplicate IDs are rejected. Per-case `status` values are `ok`, `wrong`, `runtime_error`, and `timeout`. A result with `passed: true` must have `status: "ok"`. The client must not treat the overall status as an input: the server derives it as `accepted` when all cases pass, `partial` when some but not all pass, and otherwise `timeout` if any case timed out, else `runtime_error` if any case errored, else `wrong`. Any client-supplied score is ignored.

Success: `201 Created`:

```json
{
  "status": "partial",
  "score": 2.0,
  "max_score": 10.0,
  "passed": 1,
  "total": 2,
  "cases": [{"index": 0, "passed": true}, {"index": 1, "passed": false}]
}
```

The response contains no expected outputs or case IDs. The returned `index` is zero-based in the question's server-assigned case order. Score is calculated as `sum(marks for passed cases) / sum(marks for all cases) * max_marks`. The latest submission for each coding question counts toward the attempt's Result when existing Result scoring runs. Coding scores remain unrounded floats because `Result.score` and `Result.max_score` are `FloatField`s.

Errors: field and validation errors return `400 Bad Request` as field-name arrays, for example `{"case_results":["Duplicate case_id values are not allowed."]}`, `{"case_results":["Provide exactly one result for every question case."]}`, or `{"case_results":["A passed case must have status \"ok\"."]}`. An invalid/foreign attempt returns `{"attempt_id":["Invalid attempt_id."]}`; an inactive attempt returns `{"attempt_id":["Attempt is not active."]}`; an expired attempt returns `{"attempt_id":["Attempt has expired."]}`. A different-test attempt returns `{"attempt_id":["This question is not part of the attempt test."]}`. An unpublished question or test returns `{"question_id":["Question or test is not published."]}`. Non-students get `403 Forbidden` with a `detail` field; unauthenticated requests get `401 Unauthorized`; throttled requests get `429 Too Many Requests` with a `detail` field.

The exact non-student permission response is `403 Forbidden`, `{"detail":"You do not have permission to perform this action."}`. Other field validation errors (including invalid language and oversized source) use `400 Bad Request` with the relevant field name and an array of messages.

### List the current student's coding submissions for an attempt

`GET /api/coding/submissions/?attempt_id={attempt_id}` — Student only. The attempt must belong to the caller. Any attempt status is allowed, including `SUBMITTED` and `TERMINATED`; this endpoint does not require the test to remain published or assigned. Request body: none. Example request: `GET /api/coding/submissions/?attempt_id=77`.

The response contains the latest submission per coding question for that attempt, ordered newest submission first:

```json
[
  {
    "question_id": 31,
    "status": "partial",
    "score": 2.0,
    "max_score": 10.0,
    "passed": 1,
    "total": 2,
    "cases": [{"index": 0, "passed": true}, {"index": 1, "passed": false}],
    "language": "python",
    "source_code": "print(sum(map(int, input().split())))",
    "created_at": "2026-10-31T05:40:00Z"
  }
]
```

Success: `200 OK`; an attempt with no coding submissions returns `[]`. A missing or invalid `attempt_id` returns `400 Bad Request` with a field error such as `{"attempt_id":["A valid integer is required."]}`. An attempt owned by another student or an unknown attempt returns `404 Not Found`, `{"detail":"Attempt not found."}`. A non-student gets `403 Forbidden`, `{"detail":"You do not have permission to perform this action."}`; unauthenticated requests get `401 Unauthorized`. GET and POST on `/api/coding/submissions/` share the `coding_submission` limit of 30 requests per minute.

### List all submissions for a teacher's coding question

`GET /api/coding/questions/{id}/submissions/` — Owning teacher only (roles `TEACHER` and `EVALUATOR`). Request body: none. Example request: `GET /api/coding/questions/31/submissions/`.

Success: `200 OK`. Returns up to 200 submissions, newest first, with these fields: `id`, `student` (`id`, `username`), `attempt_id`, `status`, `score`, `max_score`, `passed`, `total`, `cases` (`index`, `passed`), `language`, `source_code`, `graded_by`, and `created_at`.

```json
[
  {
    "id": 202,
    "student": {"id": 8, "username": "student1"},
    "attempt_id": 77,
    "status": "partial",
    "score": 2.0,
    "max_score": 10.0,
    "passed": 1,
    "total": 2,
    "cases": [{"index": 0, "passed": true}, {"index": 1, "passed": false}],
    "language": "python",
    "source_code": "print(sum(map(int, input().split())))",
    "graded_by": "browser",
    "created_at": "2026-10-31T05:40:00Z"
  }
]
```

A question not owned by the teacher (including an unknown question ID) returns `404 Not Found`, `{"detail":"Not found."}`. A non-teacher gets `403 Forbidden`, `{"detail":"Teacher access is required."}`; unauthenticated requests get `401 Unauthorized`.

### Output normalization and hidden-case hashes

Normalization replaces CRLF (`\r\n`) with LF (`\n`), strips only the space character U+0020 from the end of each line, and strips trailing LF characters at the end. Tabs at line ends are kept, and a lone `\r` is left untouched. Hash = lowercase SHA-256 hex of the normalized UTF-8 text.

Shared test vectors:

```text
normalize("a  \r\nb\n\n") == "a\nb"
sha256("a\nb") == 7e18f737311b2dc3b2f269dd78396b0351f14fb66efa879f768cb23181883c78
sha256(normalize("8\n")) == 2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3
```
