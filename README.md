# TXST Study Hub

TXST Study Hub is a full-stack study collaboration app for Texas State students to find courses, ask questions, share answers, and organize study content around specific classes.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Zod
- Backend: Node.js, Express, TypeScript, Prisma 7, PostgreSQL
- Auth: JWT access tokens, HTTP-only refresh cookies, bcrypt password hashing
- Local database: PostgreSQL 16 with Docker Compose

## What Works So Far

- Local PostgreSQL database through Docker Compose
- Prisma schema, migrations, and course seed data
- Backend signup, login, refresh, logout, and protected `/api/auth/me`
- Frontend signup/login/logout flow with session restore
- Protected profile page
- Course browsing and search
- Course Hub pages
- Q&A v1:
  - list course questions
  - ask a question
  - view question details
  - submit answers
  - question author can accept an answer
  - accepted answers mark questions as solved

## Local Setup

Start PostgreSQL:

```bash
docker compose up -d
```

Run the backend:

```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev
```

Backend URL:

```text
http://localhost:5050/api
```

Run the frontend:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Useful Commands

Backend:

```bash
cd server
npm run typecheck
npm run seed
npm run dev
```

Frontend:

```bash
cd client
npm run typecheck
npm run dev
```

## API Routes

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Courses:

- `GET /api/courses`
- `GET /api/courses?search=CS`
- `GET /api/courses/:id`
- `GET /api/courses/:courseId/questions`
- `POST /api/courses/:courseId/questions`

Questions and answers:

- `GET /api/questions/:questionId`
- `POST /api/questions/:questionId/answers`
- `POST /api/questions/:questionId/answers/:answerId/accept`

## Frontend Routes

- `/`
- `/signup`
- `/login`
- `/profile`
- `/courses`
- `/courses/:id`
- `/courses/:courseId/questions/new`
- `/questions/:questionId`

## Seeded Courses

- `CS 1428` - Foundations of Computer Science I
- `CS 2308` - Foundations of Computer Science II
- `MATH 2471` - Calculus I
- `MATH 2472` - Calculus II
- `MATH 2358` - Discrete Mathematics
- `ENG 1310` - College Writing I
- `POSI 2310` - Principles of American Government

## Notes

- Real `.env` files are ignored by Git.
- Voting is not built yet.
- Course Experiences, Resources, Study Groups, and admin course CRUD are not built yet.
- A larger frontend design pass is planned before moving to Course Experiences.
