# DTEP — Digital Test & Evaluation Portal

A full-stack web application for managing digital assessments in an educational organization.

## Project Overview

DTEP is designed to support three user roles:

- **Admin:** Manages teachers, students, and organizational access.
- **Teacher:** Manages assessments and student evaluation.
- **Student:** Accesses assigned assessments and results.

> This project is under active development. Features and deployment status may change as implementation progresses.

## Tech Stack

### Frontend

- React
- Vite
- React Router DOM
- Axios
- Tailwind CSS

### Backend

- Python
- Django
- Django REST Framework
- SimpleJWT

### Database

- SQLite for current local development
- PostgreSQL planned for deployment

## Repository Structure

```text
DTEP/
├── apps/
├── config/
├── frontend/
├── API_CONTRACT.md
├── manage.py
├── requirements.txt
└── README.md
```

## Prerequisites

- Python compatible with the installed Django version
- Node.js and npm
- Git

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/mahakcodes/dtep-portal.git
cd dtep-portal
```

### 2. Set up the backend

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a local `.env` file in the repository root and configure:

```dotenv
DJANGO_SECRET_KEY=your_local_secret_key
```

Do not commit `.env` or real secrets.

Apply migrations and start Django:

```bash
python manage.py migrate
python manage.py runserver
```

Backend development URL: http://127.0.0.1:8000/

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local` using the example configuration:

```dotenv
VITE_API_BASE_URL=/api
```

Start the development server:

```bash
npm run dev
```

Frontend development URL: http://localhost:5173/

> The frontend API URL and Vite proxy configuration must be verified before local integration. The example URL alone does not configure a proxy.

## Environment Variables

| Variable            | Purpose               |
| ------------------- | --------------------- |
| `DJANGO_SECRET_KEY` | Django secret key     |
| `VITE_API_BASE_URL` | Frontend API base URL |

Additional variables may be required as database, AI, file storage, and deployment integrations are implemented.

## Database

The current local setup uses SQLite. PostgreSQL hosting and migration are planned for a later stage.

Do not commit the local `db.sqlite3` file.

## Deployment

Planned deployment architecture:

- Frontend: Vercel
- Backend: Render
- PostgreSQL database: Neon

Deployment configuration and live URLs will be added after they are implemented and verified.

## API Documentation

See [`API_CONTRACT.md`](API_CONTRACT.md) for the project's API integration notes.

## Development Status

This project is under active development. Refer to the source code and API implementation for the current feature status.
