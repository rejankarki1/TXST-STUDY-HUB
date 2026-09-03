# TXST Study Hub — how the app works

Companion to [`README.md`](../README.md) (setup, stack, scripts) and
[`docs/API.md`](API.md) (endpoint reference). This document covers screens, routes,
and the paths a user actually takes.

## 1. The product in one line

A student opens the hub for a course they are taking, says what they want to study, and
gets matched with a classmate at a time they can both make.

```
Course Hub → Study Request → Study Session → optional Study Circle
                                    ↑
                          Course Questions attach to the Course Hub
```

There is **one runtime mode**. Every screen is backed by the API; there is no client-only
demo mode and no fixture data. The landing page's demo button performs a real login against
a seeded account.

## 2. Data flow

Single direction, no global store:

```
page component
  └─ use*.ts hook          fetch + mutate for that page, over useAsync
       └─ lib/api/*.ts     typed request per feature
            └─ client.ts   fetch, ApiError, single-flight refresh, 401 retry
                 └─ /api
```

`state/AuthProvider.tsx` is the only context: session, current user, and enrolled courses —
the things every screen needs. Everything else is page-scoped and refetched on mount, so no
screen can render stale data it did not ask for.

Hooks: `useAsync` (the primitive), `useHome`, `useCourse`, `useCourseOverview`,
`useDemoLogin`.

## 3. Auth flow

```
signup / login ─► access token (15m, in memory)
                  refresh token (httpOnly cookie, rotated on use)
       │
       ├─ request 401 ──► single-flight refresh ──► retry once ──► resolve
       │                        │
       │                        └─ fails ──► onSessionExpired ──► /login
       └─ logout ──► revoke + clear cookie
```

The access token never touches `localStorage`. `AppShell` renders a branded splash while the
session is resolving, so a reload never flashes the landing page at a signed-in user.

Signup is restricted to `@txstate.edu`. Rotation carries a 30-second grace window so
concurrent tabs and StrictMode double-mounts do not sign the user out; see `docs/API.md`.

## 4. Route map

Public:

| Route | Screen |
|---|---|
| `/` | Landing — pitch, 3 steps, feature panels, demo entry |
| `/signup` · `/login` | Auth |
| `/onboarding` | Name, major, grad year, first courses |

Inside `AppShell` (nav: Home · Courses · Schedule · Create · Profile):

| Route | Screen | Feeds from |
|---|---|---|
| `/home` | Next session, open requests in my courses, my requests, my circles | `useHome` |
| `/courses` | My courses + catalog search, add/remove | `courses.ts` |
| `/courses/:slug` | Course Hub shell (tabs) | `useCourse` |
| `/courses/:slug` (index) | Overview | `useCourseOverview` |
| `/courses/:slug/study` | Open study requests | `studyRequests.ts` |
| `/courses/:slug/questions` | Course Q&A | `questions.ts` |
| `/courses/:slug/questions/:questionId` | One question with answers | `questions.ts` |
| `/courses/:slug/people` | Classmates who opted in | `courses.ts` |
| `/study-requests/new` | Post a request — topic, intent, style, time options | `studyRequests.ts` |
| `/study-requests/:requestId` | Join, pick times, withdraw, edit, cancel, convert | `studyRequests.ts` |
| `/schedule` | Date-grouped upcoming, organized, completed, cancelled | `sessions.ts` |
| `/sessions/:sessionId` | Detail, RSVP, complete, cancel | `sessions.ts` |
| `/create` | Three routes out: request, circle, session | — |
| `/circles/new` · `/circles/:circleId` | Circle create and detail | `circles.ts` |
| `/profile` | Profile and study-profile visibility toggle | `auth.ts` |

Every route is `React.lazy` + `Suspense`, so the anonymous landing bundle does not carry the
application.

### Legacy redirects

The product was refactored from study groups to courses and circles. Old deep links resolve
rather than 404 (`App.tsx:64-73`):

| From | To |
|---|---|
| `/discover` | `/courses` |
| `/my-groups` | `/home` |
| `/sessions` | `/schedule` |
| `/groups/new` | `/create` |
| `/groups/:groupId` (and `/chat`, `/members`) | the matching circle |
| `/groups/:groupId/sessions[/new]` | that circle's sessions |

`/sessions/:sessionId` was never a group route and still resolves unchanged.

## 5. The core journey

```
1. Add a course                  /courses          POST /courses/:id/join
2. Open the hub                  /courses/:slug
3. Post a request                /study-requests/new
      topic · intent · meeting style · up to 3 time windows
4. A classmate joins             POST /study-requests/:id/join
5. Everyone marks availability   PUT  /study-requests/:id/availability
6. Organizer picks the winning window and converts
                                 POST /study-requests/:id/convert-to-session
      └─ creates the session, RSVPs creator GOING and participants MAYBE,
         sets the request to CONVERTED — in one transaction, idempotent
7. Session appears on /schedule and /home; attendees RSVP
8. Organizer completes it with a recap and topics covered
9. What went unanswered becomes a Course Question, answered and accepted
```

**Intent is what makes a match.** `NEED_HELP`, `CAN_HELP`, and `REVIEW_TOGETHER` are the
difference between two students who fit and two names in a list.

## 6. Sessions have two origins

A session always belongs to a **course**. Beyond that it is either:

- **converted from a study request** — `studyRequestId` set, `circleId` null, or
- **scheduled by a circle** — `circleId` set, `studyRequestId` null.

Reads are filtered by `canAccessSession`: organizer, RSVP holder, or circle member. For
anyone else the `meetingLink` and attendee list are stripped from the payload.

## 7. Rules a redesign must not break

- **Course is the container.** Requests, sessions, questions, and circles all hang off a
  course. Nothing floats free.
- **One runtime mode.** No fixture branch, no `demoMode`. If a surface is empty, it is
  genuinely empty and needs an empty state.
- **Access tokens stay in memory.** Never persist them.
- **Conversion is idempotent.** Converting twice returns `409`, never a second session.
- **Owners cannot leave their own circle** — they archive or delete it.
- **`/courses/:slug` is the canonical course URL**, resolved by slug, not id.
- **Design tokens are fixed**: primary `#7B1E28`, background `#FAF9F7`, surface `#FFFFFF`,
  foreground `#1C1A19`, Inter Variable, Lucide icons, warm neutrals, subtle shadows.
  Tailwind v4 is CSS-first — tokens live in `@theme inline` in `client/src/index.css`;
  there is no `tailwind.config.*`.
- **Course accent colours are hashed from the course code** via `courseVars()`, an 8-entry
  palette that deliberately excludes maroon. Course is colour; maroon is chrome.

## 8. Files that matter most

| Concern | File |
|---|---|
| Routes | `client/src/App.tsx` |
| Shell, nav, splash | `client/src/layouts/AppShell.tsx`, `Sidebar.tsx`, `MobileChrome.tsx` |
| Session context | `client/src/state/AuthProvider.tsx` |
| Fetch, refresh, retry | `client/src/lib/api/client.ts` |
| Shared unions and labels | `client/src/lib/contracts.ts` |
| Design system | `client/src/components/primitives.tsx`, `client/src/index.css` |
| API surface | `server/src/routes/index.ts` → `server/src/modules/*/` |
| Env contract | `server/src/config/env.ts` |
| Conversion transaction | `server/src/modules/study-requests/study-requests.service.ts` |
| Session privacy | `server/src/modules/sessions/sessions.service.ts` |
