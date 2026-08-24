# TXST Study Hub

TXST Study Hub is a full-stack study collaboration app for Texas State students. Students can manage their courses, discover study groups, create or join groups, schedule study sessions, RSVP, chat with group members, and track group activity from a polished React/Vite application backed by an Express, Prisma, and PostgreSQL API.

## Current Status

- Frontend: React, TypeScript, Vite, Tailwind CSS, Radix UI, and Lucide React under `client/`.
- Backend: Node.js, Express, TypeScript, Prisma 7, and PostgreSQL under `server/`.
- Backend feature code is organized as a modular monolith under `server/src/modules/` while shared middleware, Prisma access, utilities, and Express types remain application-level.
- PostgreSQL is the source of truth for auth, profile/onboarding, selected courses, courses, study groups, memberships, study sessions, and RSVPs.
- Group messages, unread state, and notifications are still mock/in-memory while the next backend checkpoint is planned.

## Frontend Features

- Landing, signup, login, onboarding, and demo entry flow
- Polished Home dashboard with next-session, group, discovery, and activity surfaces
- Compact Discover group marketplace with search, filters, and join states
- My Groups and course-based sidebar navigation
- Course pages with course-prefilled group creation
- Group overview, chat, sessions, and members tabs
- Create group limited to courses already added to My Courses
- Create session from existing groups
- RSVP controls
- Real persisted group memberships, sessions, and RSVPs
- Mock chat replies and typing state
- Notifications UI
- Profile and sign out
- Responsive desktop sidebar and mobile navigation

## Stack

- Frontend: React, TypeScript, Vite, React Router DOM, Tailwind CSS, Radix UI, Lucide React, Sonner
- Backend: Node.js, Express, TypeScript, Prisma 7, PostgreSQL
- Existing auth backend: JWT access tokens, HTTP-only refresh cookies, bcrypt password hashing
- Local database: PostgreSQL 16 with Docker Compose

## Backend Shape

The backend keeps a simple request flow:

route -> controller -> service -> Prisma -> PostgreSQL

Feature-specific backend files live in:

- `server/src/modules/auth`
- `server/src/modules/courses`
- `server/src/modules/groups`
- `server/src/modules/sessions`

Shared backend code remains outside modules:

- `server/src/routes/index.ts`
- `server/src/middleware`
- `server/src/lib/prisma.ts`
- `server/src/utils`
- `server/src/types`

## Local Setup

Start PostgreSQL if you are working on the backend:

docker compose up -d

Run the backend:

cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev

Backend URL: http://localhost:5050/api

Run the frontend:

cd client
npm install
npm run dev

Frontend URL: http://localhost:5173

## Useful Commands

Backend:

cd server
npm run typecheck
npm run seed
npm run dev

Frontend:

cd client
npm run typecheck
npm run build
npm run dev

## Backend Planning Note

The next backend phase should connect group messages and unread state using the existing Express + Prisma + PostgreSQL server. Notifications remain a later checkpoint.
