# TXST Study Hub — how the app works today

A map of the current frontend flow and what it depends on, so a UI redesign can
change how things look without breaking what already works.

Stack: React + React Router + Tailwind (client, port 5173) → Express + Prisma +
Postgres (server, `/api`, port 5050).

---

## 1. The one thing to know first: two runtime modes

Everything downstream branches on this.

| | Real account | Demo mode |
|---|---|---|
| Entered by | Signup / Login | Landing → "Skip to demo" (`enterDemo()`) |
| `state.accessToken` | JWT string | `null` |
| `state.demoMode` | `false` | `true` |
| Groups / sessions | fetched from API | seeded from `src/data/*.ts` |
| Every action | hits the API | mutates local state only |

Every action in `AppState.tsx` is written as:

```ts
if (stateRef.current.demoMode) { ...local mutation, toast, return }
const token = stateRef.current.accessToken
if (!token) throw new Error('Authentication required')
...api call
```

**Rule for new UI:** if you add an action, it needs both branches, or demo mode
breaks. If you add a feature with no backend, it must be demo-only or clearly
non-functional for real users.

---

## 2. Data flow (single direction)

```
Page/component  →  useApp() action  →  lib/api.ts fetch  →  Express route
                                                              ↓
state (reducer) ←  dispatch(...)  ←  mapped ApiX → domain type
     ↓
selectors.ts hooks  →  components render
```

- **One global store**: `client/src/state/AppState.tsx` — `useReducer`, no React
  Query, no per-page cache. `useApp()` gives `{ state, ...actions }`.
- **No component fetches directly.** Pages call `refreshX()` actions in a mount
  effect; the reducer holds the result.
- **Derived data lives in `state/selectors.ts`** (`useMyGroups`, `useMySessions`,
  `useGroup`, `useCourseStats`, …). Never re-derive in a page — use these, and
  the redesign inherits every rule for free.
- **API shape**: every response is `{ success, message?, data?, errors? }`.
  `apiRequest` unwraps `data` and throws `ApiError { status, data }` otherwise.

State slices: `courses`, `departments`, `groups`, `sessions`, `profile`,
`currentUser`, plus `messages` / `notifications` / `unread` (mock — see §6).
Loading/error flags per slice: `coursesLoading`, `groupsError`, etc.

---

## 3. Auth flow

1. **App boot** (`AppProvider`, two mount effects):
   - `GET /api/courses` → `courses` (public, runs even signed out).
   - `POST /api/auth/refresh` using the httpOnly `refreshToken` cookie →
     `AUTH_SUCCESS` (user + new access token) or `AUTH_FAILURE`.
   - While this runs `authLoading: true` → `AppShell` renders `null`. That is the
     blank flash on reload; a redesign can put a splash/skeleton there.
2. **Gate** — `layouts/AppShell.tsx`:
   - `authLoading` → nothing
   - `!signedIn` → `/`
   - `!onboarded` → `/onboarding`
   - else → sidebar + `<Outlet/>`
3. **Signup/Login** → `AUTH_SUCCESS` → navigate `/home` or `/onboarding` based on
   `user.onboardingCompleted`.
4. **Token handling**: access token lives in memory only (lost on reload,
   recovered by `refresh`). Refresh token is an httpOnly cookie scoped to
   `/api/auth`. All authed calls send `Authorization: Bearer <token>`.
5. **There is no 401 retry.** An expired access token (15m) makes calls fail
   until reload. Known gap, worth keeping in mind, not caused by the redesign.
6. **Onboarding** (3 steps: major/grad year → pick courses → confirm) →
   `POST /api/auth/onboarding` with `courseCodes`. Server **replaces** all
   `UserCourse` rows with that set and flips `onboardingCompleted`.

---

## 4. Route map and what feeds each screen

Public: `/` Landing · `/signup` · `/login` · `/onboarding`
App (inside `AppShell`):

| Route | Page | Loads on mount | Reads from state |
|---|---|---|---|
| `/home` | Home | `refreshSessions()` | `useMySessions().upcoming`, `useMyGroups()` |
| `/discover` | Discover | nothing (uses boot data) | `state.courses` × `state.groups` |
| `/my-groups` | MyGroups | `refreshMyGroups()` | `useMyCourseGroups()` (course→group tree) |
| `/sessions` | SessionsPage | `refreshSessions()` | `useMySessions()` upcoming + past |
| `/sessions/:sessionId` | SessionDetail | `refreshSession(id)` | `useSession`, `useGroup` |
| `/courses/:slug` | CoursePage | `refreshCourseGroups(courseId)` | `useCourseStats(course)` |
| `/groups/new` | CreateGroup | — | `state.courses`, `?courseId=` prefill |
| `/groups/:groupId` | GroupLayout | `refreshGroup`, `refreshGroupSessions` | `useGroup` |
| ↳ index | GroupOverview | — | next session, about, recent chat, members |
| ↳ `/chat` | GroupChat | — | `useGroupMessages` (**mock**) |
| ↳ `/sessions` | GroupSessions | — | `useGroupSessions` |
| ↳ `/members` | GroupMembers | — | `membersOf(group)` |
| `/groups/:groupId/sessions/new` | CreateSession | — | guards: must exist + be a member |
| `/profile` | Profile | — | `useMyCourses()`, remove-course dialog |

Anything else → redirect `/`.

**Slug note:** `/courses/:slug` is derived from the course code
(`CS 2308` → `cs-2308`); there is no slug column. Course→group matching is by
`courseId` with code as fallback (`lib/courses.ts:groupInCourse`). Keep using
those helpers rather than comparing codes inline.

**Chat is a layout special case:** `AppShell` and `GroupLayout` both check
`useMatch('/groups/:id/chat')` and switch to a fixed-height, non-scrolling frame
(mobile hides header + tab bar entirely). If you redesign the shell, preserve
that branch or chat scrolling breaks.

---

## 5. Feature flows that are real (backend-backed)

**Create group** — `CreateGroup` → `createGroup()` → `POST /api/study-groups`.
Server creates group + creator membership with role `OWNER`, **and auto-enrolls
the creator in the course** (`UserCourse` upsert). Client then re-fetches
`/auth/me` so My Courses updates, and navigates to `/groups/:id`.

**Join group** — `joinGroup()` → `POST /api/study-groups/:id/join`. Server
rejects 409 if already a member or full, otherwise adds membership **and
auto-enrolls in the course**. Client upserts the group and re-fetches `/auth/me`.

**Leave group** — `DELETE /api/study-groups/:id/membership`. **The creator cannot
leave (403)** — that is why the group menu shows "Delete group" for the creator
and "Leave group" for everyone else. Course enrollment survives leaving.

**Delete group** — `DELETE /api/study-groups/:id`, creator only (403 otherwise).
Confirmation dialog in `GroupLayout`; cascade removes sessions/messages.

**Create session** — `POST /api/study-groups/:groupId/sessions`, **members only
(403)**. Client sends `startsAt` + `durationMinutes`; `AppState` converts to
`endsAt` before the call. Organizer is auto-RSVP'd `GOING`.

**RSVP** — `PUT /api/sessions/:id/rsvp` with `going | maybe | cant`, members
only. Response is the full updated session (counts + attendee list), so the UI
just replaces it.

**Courses (My Courses)** — `POST /api/me/courses` / `DELETE /api/me/courses/:id`,
both return the full updated user. Add-course UI is one shared surface
(`AddCourseDialog` → `AddCourse`), hosted by the sidebar, Profile, and the mobile
account sheet.

**Create a missing course** — only rendered as a zero-results empty state
(`CreateMissingCourse`), deliberately not a standalone button. `POST /api/courses`.
A 409 means the course already exists — the client **adopts the course from the
409 body** instead of erroring. Client only ever sends `departmentId` (derived
from the code prefix), never a new department.

**Orphan groups** — removing a course from My Courses keeps your group
memberships. `buildCourseTree` puts those in an "outside My Courses" bucket on
My Groups and the sidebar. Don't drop that section in a redesign; those groups
would otherwise be unreachable from nav.

---

## 6. What is mock / has no backend yet

These render from `client/src/data/*.ts` and **only in demo mode** — a real
account sees them empty:

- **Group chat** (`messages`, `replyTurn`, `typingIn`): `sendMessage()` appends
  locally, then a scripted member reply fires on a timer (`data/replies.ts`).
  Prisma has a `GroupMessage` model, but **no route exists**.
- **Notifications** (`NotificationBell`, `markNotificationsRead`): seeded array;
  `Notification` model exists, no route.
- **Unread counts** (`state.unread`, group tab badge, sidebar badge): seeded
  object; `StudyGroupMember.lastReadAt` exists in the schema, unused.

The DB is ready for all three; the API is not. Design the UI for them, but treat
anything you build here as non-functional for real accounts until routes exist.

**Backend endpoints the client never calls** (built but unused):
`/api/home`, `/api/experiences`, `/api/questions`, `/api/resources`, plus
`GET /api/study-groups/:id/members`. Free to wire up if a new screen wants them.

---

## 7. Backend contract (quick reference)

Auth: `POST /auth/signup` · `POST /auth/login` · `POST /auth/refresh` ·
`POST /auth/logout` · `POST /auth/onboarding` 🔒 · `GET /auth/me` 🔒
Me: `POST /me/courses` 🔒 · `DELETE /me/courses/:courseId` 🔒
Catalog: `GET /courses?search=` · `GET /courses/:id` · `POST /courses` 🔒 ·
`GET /departments?search=`
Groups 🔒: `GET /study-groups?courseId=&search=` · `POST /study-groups` ·
`GET /study-groups/mine` · `GET /study-groups/:id` · `GET /study-groups/:id/members` ·
`POST /study-groups/:id/join` · `DELETE /study-groups/:id/membership` ·
`DELETE /study-groups/:id` · `GET /courses/:courseId/study-groups`
Sessions 🔒: `GET /study-groups/:groupId/sessions` ·
`POST /study-groups/:groupId/sessions` · `GET /sessions/mine` ·
`GET /sessions/:id` · `PUT /sessions/:id/rsvp`

🔒 = `requireAuth` (Bearer access token).

**Enum translation happens at the boundary.** The API speaks UI strings
(`'Exam prep'`, `'in-person'`, `'going'`); Prisma stores `EXAM_PREP`,
`IN_PERSON`, `GOING`. Services do the mapping — the client never sees the
SCREAMING_CASE forms. Keep sending the UI strings.

**Server-computed fields on a group** — `memberCount`, `spotsLeft`, `isFull`,
`isMember`, `isCreator`. On a session — `attendees[]`, `myRsvp`, `goingCount`,
`maybeCount`, `cantCount`. Read these (via selectors); don't recompute in the UI.

---

## 8. Rules a redesign must not break

1. Every new action needs a **demo-mode branch** and a token check.
2. Use **`state/selectors.ts`** for anything derived (membership, capacity, RSVP,
   sorting, course tree). `isMember`/`isFull`/`spotsLeft` already fall back
   correctly between API and demo shapes.
3. Use **`lib/courses.ts`** for course↔group matching and hrefs — never compare
   course codes inline.
4. Keep the **creator vs member** distinction: creator gets Delete, member gets
   Leave. Server enforces it; the UI must match or users hit a 403.
5. Keep the **chat layout branch** in `AppShell` / `GroupLayout`.
6. Keep the **orphan-groups** section reachable.
7. Actions already toast on success/failure inside `AppState`. Pages just
   `try/catch` and navigate — don't double-toast.
8. Loading/error states are per-slice flags on `state`. New screens should read
   them rather than inventing local ones.

## 9. Files that matter most for the redesign

- `client/src/App.tsx` — route table
- `client/src/layouts/AppShell.tsx` · `Sidebar.tsx` · `MobileChrome.tsx` — chrome
- `client/src/state/AppState.tsx` — store + every action (the contract)
- `client/src/state/selectors.ts` — all derived data
- `client/src/lib/api.ts` — every endpoint + response types
- `client/src/components/primitives.tsx` · `rows.tsx` · `GroupCard.tsx` ·
  `NextSessionCard.tsx` · `Avatar.tsx` — the shared visual vocabulary; swapping
  these propagates a new look across every page at once
