import type { ApiSession } from '@/lib/api'
import { dayLabel } from '@/lib/format'

const startTime = (session: ApiSession) => new Date(session.startsAt).getTime()

export const byStart = (a: ApiSession, b: ApiSession) => startTime(a) - startTime(b)
export const byStartDesc = (a: ApiSession, b: ApiSession) => startTime(b) - startTime(a)

export const isUpcoming = (session: ApiSession) =>
  session.status === 'PLANNED' && startTime(session) > Date.now()

/**
 * The Schedule page's five buckets.
 *
 * Split here rather than in the page so the rules — a cancelled session is never
 * "upcoming", a planned session in the past is awaiting a decision, not gone —
 * live in one testable place.
 */
export function groupSessions(sessions: ApiSession[], currentUserId: string | undefined) {
  const now = Date.now()

  const upcoming = sessions.filter(isUpcoming).toSorted(byStart)
  const awaitingWrapUp = sessions
    .filter((session) => session.status === 'PLANNED' && startTime(session) <= now)
    .toSorted(byStartDesc)
  const completed = sessions.filter((s) => s.status === 'COMPLETED').toSorted(byStartDesc)
  const cancelled = sessions.filter((s) => s.status === 'CANCELLED').toSorted(byStartDesc)
  const organizing = upcoming.filter((session) => session.organizerId === currentUserId)
  /* "Needs a reply" is the actionable subset — an unanswered RSVP on something
     you are expected at. MAYBE counts: it is a placeholder, not an answer. */
  const needsRsvp = upcoming.filter(
    (session) =>
      session.organizerId !== currentUserId &&
      (session.myRsvp === null || session.myRsvp === 'MAYBE'),
  )

  return { upcoming, awaitingWrapUp, completed, cancelled, organizing, needsRsvp }
}

/** Consecutive sessions sharing a day, for date-separated lists. */
export function groupByDay(sessions: ApiSession[]) {
  const days: { label: string; sessions: ApiSession[] }[] = []

  for (const session of sessions) {
    const label = dayLabel(session.startsAt)
    const last = days[days.length - 1]

    if (last && last.label === label) {
      last.sessions.push(session)
    } else {
      days.push({ label, sessions: [session] })
    }
  }

  return days
}
