# TXST Study Hub

TXST Study Hub is a full-stack study collaboration app foundation for Texas State students.

## Stack

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Zod
- Backend: Node.js, Express, TypeScript, Prisma 7, PostgreSQL
- Auth: JWT access tokens, HTTP-only refresh cookies, bcrypt password hashing
- Local database: PostgreSQL 16 with Docker Compose

## What Works So Far

- Local PostgreSQL database through Docker
- Prisma schema and initial migration
- Backend signup, login, refresh, logout, and protected `/api/auth/me`
- Frontend signup/login/logout flow
- In-memory access token handling with refresh-cookie session restore
- Protected profile page

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

## Notes

- Real `.env` files are ignored by Git.
- Course, post, answer, study group, and admin features are not built yet.
