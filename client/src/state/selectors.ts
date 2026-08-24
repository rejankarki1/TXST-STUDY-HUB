import * as React from 'react'
import type { Group, GroupMember, RsvpStatus, Session } from '@/data/types'
import { peopleById, VIEWER_ID } from '@/data/people'
import type { ApiCourse } from '@/lib/api'
import { buildCourseTree, groupInCourse } from '@/lib/courses'
import { useApp } from './AppState'

/* ------------------------------------------------------------- pure bits */

export const isMember = (group: Group) =>
  group.isMember ?? group.members?.some((member) => member.id === VIEWER_ID) ?? false
export const isFull = (group: Group) =>
  group.isFull ?? (group.memberCount ?? group.members?.length ?? 0) >= group.maxMembers
export const spotsLeft = (group: Group) =>
  group.spotsLeft ?? Math.max(group.maxMembers - (group.memberCount ?? group.members?.length ?? 0), 0)

export const membersOf = (group: Group): GroupMember[] =>
  group.members ??
  group.memberIds
    ?.map((id) => peopleById[id])
    .filter(Boolean)
    .map((person) => ({
      id: person.id,
      name: person.name,
      major: person.major,
      gradYear: person.gradYear,
    })) ??
  []

export const rsvpIds = (session: Session, status: RsvpStatus) =>
  Object.entries(session.rsvps ?? {})
    .filter(([, s]) => s === status)
    .map(([id]) => id)

export const rsvpPeople = (session: Session, status: RsvpStatus): GroupMember[] => {
  if (session.attendees) {
    return session.attendees
      .filter((attendee) => attendee.status === status)
      .map((attendee) => ({
        id: attendee.id,
        name: attendee.name,
        major: attendee.major,
        gradYear: attendee.gradYear,
      }))
  }

  return rsvpIds(session, status)
    .map((id) => peopleById[id])
    .filter(Boolean)
    .map((person) => ({
      id: person.id,
      name: person.name,
      major: person.major,
      gradYear: person.gradYear,
    }))
}

export const goingCount = (session: Session) =>
  session.goingCount ?? rsvpIds(session, 'going').length
export const myRsvp = (session: Session): RsvpStatus | undefined =>
  session.myRsvp ?? session.rsvps?.[VIEWER_ID]

const byStart = (a: Session, b: Session) =>
  new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()

const upcoming = (s: Session) => new Date(s.startsAt).getTime() > Date.now()

/* ----------------------------------------------------------------- hooks */

export function useGroup(groupId: string | undefined) {
  const { state } = useApp()
  return React.useMemo(
    () => state.groups.find((g) => g.id === groupId),
    [state.groups, groupId],
  )
}

export function useMyGroups() {
  const { state } = useApp()
  return React.useMemo(() => state.groups.filter(isMember), [state.groups])
}

export function useGroupsCreatedByMe() {
  const { state } = useApp()
  return React.useMemo(
    () => state.groups.filter((g) => g.isCreator ?? g.creatorId === state.currentUser?.id),
    [state.groups, state.currentUser?.id],
  )
}

/**
 * The courses the student is enrolled in. currentUser is authoritative; the two
 * fallbacks cover demo mode and the window before /auth/me resolves.
 */
export function useMyCourses(): ApiCourse[] {
  const { state } = useApp()
  const { profile } = state
  return React.useMemo(() => {
    if (state.currentUser?.courses.length) return state.currentUser.courses
    if (profile.courseDetails.length) return profile.courseDetails
    return profile.courses
      .map((code) => state.courses.find((course) => course.code === code))
      .filter((course): course is ApiCourse => Boolean(course))
  }, [state.currentUser?.courses, profile.courseDetails, profile.courses, state.courses])
}

/**
 * Joined groups nested under enrolled courses. See buildCourseTree.
 *
 * Enrolment comes from useMyCourses rather than profile.courseDetails directly:
 * demo mode carries course *codes* with no details, so reading courseDetails
 * alone left every demo group stranded in the orphan bucket.
 */
export function useMyCourseGroups() {
  const { state } = useApp()
  const enrolled = useMyCourses()
  return React.useMemo(
    () => buildCourseTree(enrolled, state.groups.filter(isMember), state.courses),
    [state.groups, enrolled, state.courses],
  )
}

/* Shared so the no-id early return keeps a stable identity across renders. */
const NO_SESSIONS: { upcoming: Session[]; past: Session[] } = { upcoming: [], past: [] }

/** Sessions for one group, split into upcoming (soonest first) and past (newest first). */
export function useGroupSessions(groupId: string | undefined) {
  const { state } = useApp()
  return React.useMemo(() => {
    /* No group, nothing to scan. Lets a caller that already has the session
       opt out by passing undefined, instead of paying for a full scan. */
    if (!groupId) return NO_SESSIONS
    const all = state.sessions.filter((s) => s.groupId === groupId)
    return {
      upcoming: all.filter(upcoming).sort(byStart),
      past: all.filter((s) => !upcoming(s)).sort((a, b) => byStart(b, a)),
    }
  }, [state.sessions, groupId])
}

export function useNextGroupSession(groupId: string | undefined) {
  return useGroupSessions(groupId).upcoming[0]
}

/**
 * Every group's soonest upcoming session, in one pass.
 *
 * useNextGroupSession is per-group and rescans state.sessions each time, which
 * a grid of cards turns into N scans. A page rendering many groups builds this
 * once and hands each card its own session.
 */
export function useNextSessionByGroup(): ReadonlyMap<string, Session> {
  const { state } = useApp()
  return React.useMemo(() => {
    const out = new Map<string, Session>()
    for (const session of state.sessions) {
      if (!upcoming(session)) continue
      const held = out.get(session.groupId)
      if (!held || byStart(session, held) < 0) out.set(session.groupId, session)
    }
    return out
  }, [state.sessions])
}

/** Every upcoming session across the groups the viewer belongs to. */
export function useMySessions() {
  const { state } = useApp()
  return React.useMemo(() => {
    const mine = new Set(state.groups.filter(isMember).map((g) => g.id))
    const all = state.sessions.filter((s) => mine.has(s.groupId))
    return {
      upcoming: all.filter(upcoming).sort(byStart),
      past: all.filter((s) => !upcoming(s)).sort((a, b) => byStart(b, a)),
    }
  }, [state.groups, state.sessions])
}

export function useNextSession() {
  return useMySessions().upcoming[0]
}

export function useSession(sessionId: string | undefined) {
  const { state } = useApp()
  return React.useMemo(
    () => state.sessions.find((s) => s.id === sessionId),
    [state.sessions, sessionId],
  )
}

export function useGroupMessages(groupId: string | undefined) {
  const { state } = useApp()
  return React.useMemo(
    () =>
      state.messages
        .filter((m) => m.groupId === groupId)
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()),
    [state.messages, groupId],
  )
}

export function useLastMessages(groupId: string | undefined, count: number) {
  const all = useGroupMessages(groupId)
  return React.useMemo(() => all.slice(-count), [all, count])
}

export function useUnreadTotal() {
  const { state } = useApp()
  return React.useMemo(
    () =>
      Object.entries(state.unread)
        .filter(([groupId]) => state.groups.some((g) => g.id === groupId && isMember(g)))
        .reduce((sum, [, n]) => sum + n, 0),
    [state.unread, state.groups],
  )
}

export function useUnreadNotifications() {
  const { state } = useApp()
  return React.useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  )
}

/** Course-level rollups for the course page and discover chips. */
export function useCourseStats(course: { id: string; code: string } | undefined) {
  const { state } = useApp()
  return React.useMemo(() => {
    const groupsInCourse = course ? state.groups.filter((g) => groupInCourse(g, course)) : []
    const studentIds = new Set(groupsInCourse.flatMap((g) => membersOf(g).map((m) => m.id)))
    const groupIds = new Set(groupsInCourse.map((g) => g.id))
    const upcomingSessions = state.sessions
      .filter((s) => groupIds.has(s.groupId) && upcoming(s))
      .sort(byStart)
    return {
      groups: groupsInCourse,
      studentCount: studentIds.size,
      upcomingSessions,
    }
  }, [state.groups, state.sessions, course?.id, course?.code])
}
