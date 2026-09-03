# API Reference

Base URL: `/api` (dev: `http://localhost:5050/api`).

All requests and responses are JSON. The client reaches the API through the Vite
dev-server proxy, so `VITE_API_URL=/api` is correct for local development.

## Response envelope

Every endpoint returns the same shape.

**Success**

```json
{ "success": true, "message": "Human-readable summary", "data": { } }
```

**Failure**

```json
{ "success": false, "message": "What went wrong" }
```

Validation failures add a field map produced by Zod:

```json
{
  "success": false,
  "message": "Invalid signup data",
  "errors": { "email": ["Use your @txstate.edu email"] }
}
```

Handlers throw `AppError(message, status, data?)` (`server/src/middleware/error.ts`);
anything unrecognised is logged server-side and returned as a bare `500` so internals
never reach the client.

## Status codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Validation failed — check `errors` |
| `401` | Missing, expired, or invalid access token |
| `403` | Authenticated but not permitted (not the organizer, owner, or a member) |
| `404` | Not found, or not visible to this user |
| `409` | Conflict — duplicate join, already converted, capacity reached |
| `429` | Rate limited |
| `500` | Unhandled server error |

## Authentication

Two tokens:

- **Access token** — JWT, `15m` default lifetime, sent as `Authorization: Bearer <token>`.
  Never persisted to storage; held in memory by the client.
- **Refresh token** — opaque, stored in an `httpOnly` cookie (`refreshToken`), rotated on
  every use. `SameSite=Lax` in development; `SameSite=None; Secure` when
  `CROSS_SITE_COOKIES=true` (the Vercel + Render split-origin deployment).

Rotation carries a **30-second grace window**: a token already rotated but presented again
inside the window is honoured, so concurrent tabs and React StrictMode double-mounts do not
sign the user out. Presented after the window, it is treated as reuse and every token for
that user is revoked.

Clients call `POST /auth/refresh` on a `401`, retry the original request once, and never
recurse. `server/src/middleware/rateLimit.ts` throttles `signup`, `login`, and `refresh`.

Signup is restricted to `ALLOWED_EMAIL_DOMAIN` (default `txstate.edu`). Emails are trimmed
and lowercased before storage. Login returns one generic message for both unknown-email and
wrong-password so the endpoint cannot be used to enumerate accounts.

## Enumerations

Wire values are `SCREAMING_CASE`; display strings live only in the client
(`client/src/lib/contracts.ts`).

| Enum | Values |
|---|---|
| `StudyRequestIntent` | `NEED_HELP` · `CAN_HELP` · `REVIEW_TOGETHER` |
| `StudyRequestStatus` | `OPEN` · `MATCHED` · `CONVERTED` · `CANCELLED` · `EXPIRED` |
| `MeetingStyle` | `IN_PERSON` · `ONLINE` · `FLEXIBLE` |
| `SessionMode` | `IN_PERSON` · `ONLINE` |
| `SessionStatus` | `PLANNED` · `COMPLETED` · `CANCELLED` |
| `RsvpStatus` | `GOING` · `MAYBE` · `CANT` |
| `CircleStatus` | `ACTIVE` · `ARCHIVED` |
| `QuestionStatus` | `OPEN` · `SOLVED` |

---

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness. Returns uptime. |
| `GET` | `/db-health` | — | Runs `SELECT 1` against Postgres. |

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | — | Create an account. Domain-restricted, rate limited. |
| `POST` | `/auth/login` | — | Exchange credentials for a token pair. Rate limited. |
| `POST` | `/auth/refresh` | cookie | Rotate the refresh cookie, issue a new access token. |
| `POST` | `/auth/logout` | cookie | Revoke the refresh token and clear the cookie. |
| `GET` | `/auth/me` | Bearer | Current user, profile, and enrolled courses. |
| `PATCH` | `/auth/me` | Bearer | Update profile — name, major, grad year, study-profile visibility. |

## Courses — `/api/courses`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/courses` | — | Search the catalog. Query: `q`, `department`. |
| `GET` | `/courses/departments` | — | Departments, for the catalog filter. |
| `POST` | `/courses` | Bearer | Create a course missing from the catalog. |
| `GET` | `/courses/:courseId` | — | One course. |
| `POST` | `/courses/:courseId/join` | Bearer | Add to my courses. |
| `DELETE` | `/courses/:courseId/leave` | Bearer | Remove from my courses. |
| `GET` | `/courses/:courseId/people` | Bearer | Classmates with `studyProfileVisible: true`. Returns `id`, `name`, `major`, `gradYear`, and current open-request intent — **never** email or credentials. |
| `GET` | `/courses/:courseId/sessions` | Bearer | Sessions for this course. |
| `GET` | `/courses/:courseId/study-requests` | Bearer | Open requests in this course. |
| `POST` | `/courses/:courseId/study-requests` | Bearer | Post a request, with time options. |
| `GET` | `/courses/:courseId/questions` | Bearer | Course Q&A. |
| `POST` | `/courses/:courseId/questions` | Bearer | Ask a question. |

## Study requests — `/api/study-requests`

All routes require a Bearer token.

| Method | Path | Description |
|---|---|---|
| `GET` | `/study-requests/mine` | Requests I posted or joined. |
| `GET` | `/study-requests/opportunities` | Open requests across my courses, mine excluded. |
| `GET` | `/study-requests/:requestId` | One request with time options and participants. |
| `PATCH` | `/study-requests/:requestId` | Edit. Creator only. |
| `POST` | `/study-requests/:requestId/join` | Join. `409` if already joined or at capacity. |
| `DELETE` | `/study-requests/:requestId/join` | Withdraw. |
| `PUT` | `/study-requests/:requestId/availability` | Replace my selected time options. |
| `PATCH` | `/study-requests/:requestId/cancel` | Cancel. Creator only. |
| `POST` | `/study-requests/:requestId/convert-to-session` | Turn the request into a session. |

### `convert-to-session`

The one endpoint with non-obvious semantics. Runs inside a single transaction:

1. Re-reads the request inside the transaction; rejects unless `status === 'OPEN'` and
   the caller is the creator.
2. Rejects with `409` if a session is already linked — converting twice never produces a
   second session.
3. Verifies the chosen `timeOptionId` belongs to this request.
4. Creates the `StudySession` with `courseId` and `studyRequestId` set, `circleId` null.
5. RSVPs the creator `GOING` and every other participant `MAYBE`.
6. Sets `status = 'CONVERTED'`.

## Circles — `/api/circles`

All routes require a Bearer token.

| Method | Path | Description |
|---|---|---|
| `GET` | `/circles` | Browse circles. Query filters supported. |
| `GET` | `/circles/mine` | Circles I belong to. |
| `POST` | `/circles` | Create a circle. |
| `GET` | `/circles/:circleId` | One circle. |
| `PATCH` | `/circles/:circleId` | Edit. Owner only. |
| `DELETE` | `/circles/:circleId` | Delete. Owner only. |
| `PATCH` | `/circles/:circleId/archive` | Archive. Owner only. |
| `GET` | `/circles/:circleId/members` | Roster. |
| `POST` | `/circles/:circleId/join` | Join. `409` when full. |
| `DELETE` | `/circles/:circleId/leave` | Leave. The **owner cannot leave** — `403`. |
| `GET` | `/circles/:circleId/sessions` | Sessions for this circle. |
| `POST` | `/circles/:circleId/sessions` | Schedule a recurring-team session. |

## Sessions — `/api/sessions`

All routes require a Bearer token. A session belongs to a course, and optionally to a
circle or a converted study request.

| Method | Path | Description |
|---|---|---|
| `GET` | `/sessions/mine` | My upcoming and past sessions. |
| `GET` | `/sessions/:sessionId` | One session. |
| `PATCH` | `/sessions/:sessionId` | Edit. Organizer only. |
| `PUT` | `/sessions/:sessionId/rsvp` | Set my RSVP. |
| `PATCH` | `/sessions/:sessionId/complete` | Mark complete, with recap and topics covered. |
| `PATCH` | `/sessions/:sessionId/cancel` | Cancel. Organizer only. |

**Privacy.** `canAccessSession` (`sessions.service.ts`) grants access to the organizer, any
RSVP holder, and members of the owning circle. For everyone else the `meetingLink` and the
attendee list are stripped from the payload. This applies to every session read.

## Questions — `/api/questions`

All routes require a Bearer token. Questions are created under a course
(`POST /courses/:courseId/questions`) and managed here.

| Method | Path | Description |
|---|---|---|
| `GET` | `/questions/mine` | Questions I have answered. |
| `GET` | `/questions/:questionId` | Question with answers. |
| `PATCH` | `/questions/:questionId` | Edit. Author only. |
| `DELETE` | `/questions/:questionId` | Delete. Author only. |
| `POST` | `/questions/:questionId/answers` | Answer. |
| `PATCH` | `/questions/:questionId/answers/:answerId` | Edit an answer. Author only. |
| `DELETE` | `/questions/:questionId/answers/:answerId` | Delete an answer. Author only. |
| `PATCH` | `/questions/:questionId/answers/:answerId/accept` | Accept. **Question author only**; the answer must belong to this question. Sets `status = 'SOLVED'`. |
