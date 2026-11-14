# DTEP — Digital Test & Evaluation Portal

A full-stack web application for running digital assessments in a college. Admins provision teachers and students, teachers create and publish tests (MCQ, descriptive and coding), and students take timed tests with server-enforced anti-cheating rules.

**Live demo:** https://dtep-portal.vercel.app/
(The backend runs on a free Render instance, so the first request after a period of inactivity can take 30–60 seconds.)


## Features

- **Roles:** Admin, Teacher (shown as "Evaluator" on the login screen) and Student, enforced on the backend. Teachers and students do not self-register; the admin creates their accounts.
- **Assessments:** MCQ, descriptive and coding questions. MCQ is scored automatically, descriptive answers are graded by the teacher, and coding is scored automatically from weighted test cases.
- **Attempts:** timed attempts with autosave and resume after refresh, plus a results page with score and percentage.
- **Coding questions:** Monaco editor, Python and JavaScript, visible sample cases and hidden test cases, Run and Submit, and teacher review of submitted code.
- **Anti-cheating:** fullscreen and tab-switch tracking, copy, paste and right-click restrictions, a server-side violation count with automatic termination, a server-anchored timer, and a violation timeline for teachers.

## How coding questions work

Student code never runs on the server. Python runs in the browser through Pyodide and JavaScript runs in a Web Worker, so the feature needs no code-execution service and costs nothing to host.

- On Submit, the browser fetches all test cases. Visible cases include the expected output. Hidden cases include only the input and a SHA-256 hash of the normalized expected output, so the answer is never sent to the browser.
- The browser runs every case and reports pass/fail per case. The server validates the attempt and the case ids, computes the score from the case weights, and stores the code and results.
- The API details, including the output normalization rule and test vectors, are in [`API_CONTRACT.md`](API_CONTRACT.md).

## Anti-cheating

Violations, the deadline and termination are decided on the server. The browser only reports events.

- Tab switches and fullscreen exits count toward the limit (`MAX_TEST_VIOLATIONS`, default 3). Copy, paste and right-click attempts are blocked and logged but do not count.
- The server terminates the attempt at the limit and creates the result. Writes to a terminated, submitted or expired attempt are rejected.
- The timer is based on the server's clock. Expired attempts are finalized lazily on the next request, so no background worker is needed.

## Limitations

- Coding grading is reported by the browser and is trust-based. A determined student could send fake per-case results through the API. This is acceptable for internal college tests, not for high-stakes exams. Each submission records `graded_by = "browser"`, so a server-side judge can replace it later.
- Only Python and JavaScript are supported for coding questions.
- Anti-cheating is a deterrent plus server-side enforcement. It cannot stop a second device or phone, and there is no camera, microphone, recording or face detection.
- Tests are meant to be taken on a desktop browser.
- When creating a test, add at least one MCQ first; then add coding questions from **Tests → Details → Coding questions**.
- Free-tier hosting: Render sleeps when idle and Neon scales to zero.

## Tech Stack

**Frontend:** React, Vite, React Router, Axios, Tailwind CSS, Monaco Editor, Pyodide (via CDN)
**Backend:** Python, Django, Django REST Framework, SimpleJWT, WhiteNoise, Gunicorn
**Database:** PostgreSQL (Neon)
**Hosting:** Vercel (frontend), Render (backend), Neon (database)

## Repository Structure

```text
dtep-portal/
├── apps/          # Django apps: users, tests, evaluations, results, coding
├── config/        # Django project settings and URLs
├── frontend/      # React + Vite app
├── API_CONTRACT.md
├── manage.py
├── requirements.txt
└── README.md
```

## Local Development

### Prerequisites

- Python 3.11 or 3.12
- Node.js 18+ and npm
- Git
- A PostgreSQL database (a free Neon branch works well), or SQLite for a quick start

### 1. Clone

```bash
git clone https://github.com/mahakcodes/dtep-portal.git
cd dtep-portal
```

### 2. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the repository root (never commit it):

```dotenv
DJANGO_SECRET_KEY=<a long random string>
DATABASE_URL=<your PostgreSQL connection string, or sqlite:///db.sqlite3 for a quick start>
DEBUG=True
```

Then:

```bash
python manage.py migrate
python manage.py createsuperuser   # then set this user's role to ADMIN
python manage.py runserver
```

The backend runs at http://127.0.0.1:8000/.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

The frontend runs at http://localhost:5173/ and calls `http://127.0.0.1:8000` by default, so no extra configuration is needed locally. Use `localhost:5173` in the browser, because the backend's CORS allow-list contains that origin.

## Environment Variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Backend | Django secret key (required) |
| `DATABASE_URL` | Backend | Database connection string (required) |
| `DEBUG` | Backend | `True` locally, `False` in production |
| `CORS_ALLOWED_ORIGINS` | Backend | Comma-separated frontend origins allowed in production (no trailing slash) |
| `MAX_TEST_VIOLATIONS` | Backend | Violations allowed before an attempt is terminated (default 3) |
| `VITE_API_BASE_URL` | Frontend | Backend host without `/api` (default `http://127.0.0.1:8000`) |

`RENDER_EXTERNAL_HOSTNAME` is set automatically by Render.

## Tests

```bash
# Backend (uses a throwaway SQLite database)
DATABASE_URL=sqlite:///test_local.sqlite3 python manage.py test

# Frontend
cd frontend
npm test
npm run build
```

## Deployment

- **Database:** Neon PostgreSQL. Use a separate Neon branch for development so local work never touches production data.
- **Backend (Render):** build command `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`, start command `gunicorn config.wsgi:application`. Set `DJANGO_SECRET_KEY`, `DATABASE_URL`, `DEBUG=False`, `PYTHON_VERSION` and `CORS_ALLOWED_ORIGINS` (the Vercel URL).
- **Frontend (Vercel):** root directory `frontend`, with `VITE_API_BASE_URL` set to the Render URL. This variable is read at build time, so redeploy after changing it.
- The `main` branch deploys automatically. Work happens on feature branches and is merged through pull requests.

## API Documentation

See [`API_CONTRACT.md`](API_CONTRACT.md) for endpoints, request and response shapes, and the coding and anti-cheating rules.
