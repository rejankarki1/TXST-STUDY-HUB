# TXST Study Hub

Course-centered study matching for Texas State students.

Students open a **Course Hub**, post or join a **Study Request** for a specific topic,
converge on a time that works for everyone, and the organizer converts it into a real
**Study Session**. Recurring teams become **Study Circles**. What the group could not solve
becomes a **Course Question** that stays searchable for whoever takes the class next term.

```
Course Hub → Study Request → Study Session → optional Study Circle
                                    ↑
                          Course Questions attach directly to the Course Hub
```

This is deliberately not a campus feed or another group chat. One hub per class, holding the
people, the sessions, and the answers for that class.

## Stack

| Layer | Choice |
|---|---|
| Client | React 19, TypeScript, Vite, Tailwind CSS v4 (CSS-first), Radix UI, Lucide icons, React Router |
| Server | Node 20+, Express 5, TypeScript, Zod, Prisma 7 |
| Database | PostgreSQL 16 (Docker) |
| Tests | Vitest — Supertest integration on the server, jsdom unit tests on the client |
| Lint | oxlint |
| Deploy | Vercel (client) + Render (server) |

## Architecture

```
client/src/
  pages/            route components (course/, circle/, auth/, landing/)
  components/       primitives.tsx + feature components, ui/ for Radix wrappers
  hooks/            use*.ts — page-scoped fetch + mutate per feature
  state/            AuthProvider.tsx — session, current user, my courses
  lib/api/          client.ts (fetch, ApiError, single-flight refresh, 401 retry) + one file per feature
  lib/contracts.ts  shared union types and label maps mirroring the server Zod enums

server/src/
  config/env.ts     Zod-validated environment, parsed once at startup
  modules/          auth · courses · study-requests · circles · sessions · questions
                    each split schema / routes / controller / service, Prisma confined to services
  middleware/       auth · validate · params · rateLimit · error · notFound
  routes/index.ts   mounts every module under /api
```

The server is a modular monolith. Prisma never appears outside a service, so controllers stay
thin and every query is testable in isolation.

## Setup

Requires Node 20+ and Docker.

```bash
npm run install:all     # root + server + client
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run db:up           # Postgres on :5433, test Postgres on :5434
npm run db:deploy       # apply migrations
npm run db:seed         # idempotent demo data
npm run dev             # server :5050 + client :5173
```

Or the whole sequence at once:

```bash
npm run setup && npm run dev
```

`npm run dev` needs Docker Postgres running first — the server fails fast with a readable
message if `DATABASE_URL` is unreachable or any required variable is missing.

### If the client lands on a port other than 5173

Vite takes the next free port when 5173 is already in use, so a second `npm run dev` puts the
app on `:5174`. Browsers attach an `Origin` header to every POST, even a same-origin one, and
the Vite proxy forwards it — so the API sees an origin the `CLIENT_URL` allowlist has never
heard of and refuses the request. Login is the first thing that breaks.

In development the server accepts any `localhost` / `127.0.0.1` origin regardless of port, so
this no longer bites. In production only `CLIENT_URL` is honoured, and a refused origin comes
back as `403 Origin … is not allowed` rather than a generic 500 — if you see that in a
deployment, add the origin to `CLIENT_URL`.

Two other things worth recognising rather than debugging:

- `POST /api/auth/refresh` returning **401** on a signed-out page load is the expected boot
  check finding no cookie. The browser logs it in red; the app handles it and renders login.
- The auth endpoints allow 20 attempts per 15 minutes per IP. Repeated testing against
  `localhost` shares one bucket, and the limit clears on a server restart.

### Demo account

The seed creates `@txstate.edu` demo users with the password from `DEMO_PASSWORD`
(default `DemoStudy!2026`). `demo.student@txstate.edu` is the one carrying the full seeded
dataset — study requests, circles, sessions. `demo2.student@txstate.edu` is a second
full-access login with the same courses but no activity, so two people can be signed in
without sharing a session. The landing page's "Explore the demo account" button signs into
`demo.student@txstate.edu` through the real `POST /api/auth/login` — there is no client-only
demo mode. Clear `VITE_DEMO_EMAIL` and `VITE_DEMO_PASSWORD` to hide the button.

## Environment variables

**`server/.env`**

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | — | `development` | `development` · `test` · `production` |
| `PORT` | — | `5050` | |
| `DATABASE_URL` | **yes** | — | |
| `DATABASE_URL_TEST` | for tests | — | Must not point at dev data — suites truncate between files |
| `JWT_ACCESS_SECRET` | **yes** | — | Minimum 32 characters; rotating it signs out every session |
| `JWT_ACCESS_EXPIRES_IN` | — | `15m` | |
| `REFRESH_TOKEN_COOKIE_NAME` | — | `refreshToken` | |
| `CLIENT_URL` | — | `http://localhost:5173` | Comma-separated CORS allowlist |
| `CROSS_SITE_COOKIES` | — | `false` | `true` sets `SameSite=None; Secure` on the refresh cookie |
| `ALLOWED_EMAIL_DOMAIN` | — | `txstate.edu` | Signup restriction |
| `DEMO_PASSWORD` | — | `DemoStudy!2026` | Seeded demo accounts. Local only |

**`client/.env`**

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `/api` | Proxied to `:5050` in dev; the full origin in production |
| `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` | seeded demo user | Clear both to hide the demo button |

## Scripts

Run from the repository root.

| Script | Does |
|---|---|
| `npm run dev` | Server and client together |
| `npm run typecheck` | `tsc` across both packages, **including test files** |
| `npm run lint` | oxlint over client, server, prisma, tests |
| `npm test` | Server integration suite, then client unit tests |
| `npm run build` | `tsc` server, `tsc -b && vite build` client |
| `npm run verify` | typecheck → lint → test → build |
| `npm run db:up` / `db:down` | Docker Postgres |
| `npm run db:migrate` / `db:deploy` / `db:seed` | Prisma |

## Auth

Access tokens are 15-minute JWTs held **in memory** — never in `localStorage`. Refresh
tokens are opaque, `httpOnly`, and rotated on every use.

Two mechanisms keep rotation from signing people out:

- The client holds a module-level **single-flight** refresh promise, so concurrent 401s
  await one rotation rather than racing.
- The server honours an already-rotated token for a **30-second grace window**. Presented
  after the window, it is treated as reuse and every token for that user is revoked.

On a 401 the client refreshes once, retries the request once, and never recurses.

## Testing

```bash
npm run db:up          # the test database must be running
npm test
```

The server suite runs against `txst_study_hub_test` on port `5434` — a tmpfs container that
is disposable by design, truncated between files. It covers auth (domain rejection,
normalization, rotation, concurrent refresh), courses, study requests (duplicate join,
capacity, unauthorized edit, duplicate conversion, transaction rollback), circles
(owner-leave rejection, archive authorization), sessions (RSVP, meeting-link privacy,
complete/cancel), and questions (accept-answer ownership, cross-question accept rejection).

`server/tests/smoke.test.ts` walks the whole product: signup → onboarding → add course →
create request → second user joins and selects times → convert → RSVP → complete → ask,
answer, and accept a question.

The client suite covers course slug resolution, request filtering, time-option selection,
capacity math, route guards, the 401-refresh-retry path, RSVP state, and question display.

## Known advisories

`npm audit` reports 3 high-severity findings in the server, all one chain:

```
prisma@7.9.1 (devDependency)
  └─ @prisma/config@7.9.1
       └─ deepmerge-ts@7.1.5   GHSA-ggr8-5vv4-36mx — stack exhaustion on recursive merge
```

**Not fixed deliberately.** The only remedy npm offers is `--force`, which downgrades the
Prisma CLI to `6.12.0` and breaks it against `@prisma/client@7.9.1`. The vulnerable code path
merges Prisma's own config at migrate time and never sees request input. Revisit when
`@prisma/config` ships a patched `deepmerge-ts`.

The client reports 0 vulnerabilities.

## Documentation

- [`docs/API.md`](docs/API.md) — full endpoint reference, response envelope, auth model
- [`docs/APP_FLOW.md`](docs/APP_FLOW.md) — screens, routes, and user journeys

## Deployment

`client/vercel.json` (SPA rewrite), `server/Dockerfile` (multi-stage, runs
`prisma migrate deploy` on start), and `render.yaml` are committed and locally verified.

For the split-origin production setup, set on the server: `NODE_ENV=production`,
`CROSS_SITE_COOKIES=true`, and `CLIENT_URL` to the Vercel origin(s). Set `VITE_API_URL` to
the Render API origin on the client. Creating the Vercel and Render services requires
account credentials and is the one step not performed here.

## Scope

**Built:** course hubs, study requests with time-option matching and conversion to sessions,
sessions with RSVP and completion, study circles, course Q&A with accepted answers, profile
and study-profile visibility, seeded demo data.

**Deliberately not built:** per-circle chat, DMs, social feed, followers, notifications,
anonymous posting, voting, file uploads, live video, AI matching, course reviews, resource
marketplace, streaks and leaderboards, Redis, WebSockets, GraphQL, microservices, mobile app.

---

Independent student project. Not affiliated with Texas State University.
