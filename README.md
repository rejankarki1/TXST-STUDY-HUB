# TXST Study Hub

TXST Study Hub is a full-stack study collaboration app for Texas State students. The current client is a redesigned React/Vite study group experience for finding classmates, joining study groups, scheduling sessions, chatting, and managing RSVPs.

## Current Status

- Existing repository history is preserved in this repo.
- Frontend: redesigned React, TypeScript, Vite, Tailwind CSS app under client/.
- Frontend data is currently mock/in-memory state while backend integration is planned.
- Backend: existing Node.js, Express, TypeScript, Prisma, PostgreSQL API remains under server/.
- Backend implementation for the redesigned group/session/chat UI is intentionally paused for the next planning phase.

## Frontend Features

- Landing, signup, login, onboarding, and demo entry flow
- Home dashboard
- Discover groups
- My groups
- Course pages
- Group overview, chat, sessions, and members tabs
- Create group
- Create session
- RSVP controls
- Mock chat replies and typing state
- Notifications UI
- Profile and sign out
- Responsive desktop sidebar and mobile navigation

## Stack

- Frontend: React, TypeScript, Vite, React Router DOM, Tailwind CSS, Radix UI, Lucide React, Sonner
- Backend: Node.js, Express, TypeScript, Prisma 7, PostgreSQL
- Existing auth backend: JWT access tokens, HTTP-only refresh cookies, bcrypt password hashing
- Local database: PostgreSQL 16 with Docker Compose

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

The next backend phase should connect the redesigned frontend to real persistence using the existing Express + Prisma + PostgreSQL server instead of creating a separate project. The main data areas to plan are users/profile/onboarding, courses, groups, group memberships, sessions, RSVPs, messages, unread state, and notifications.
