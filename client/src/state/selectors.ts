import * as React from 'react'
import type { Group, Person, RsvpStatus, Session } from '@/data/types'
import { peopleById, VIEWER_ID } from '@/data/people'
import { useApp } from './AppState'

/* ------------------------------------------------------------- pure bits */

export const isMember = (group: Group) => group.memberIds.includes(VIEWER_ID)
export const isFull = (group: Group) => group.memberIds.length >= group.maxMembers
export const spotsLeft = (group: Group) => group.maxMembers - group.memberIds.length

export const membersOf = (group: Group): Person[] =>
  group.memberIds.map((id) => peopleById[id]).filter(Boolean)

export const rsvpIds = (session: Session, status: RsvpStatus) =>
  Object.entries(session.rsvps)
    .filter(([, s]) => s === status)
    .map(([id]) => id)

export const rsvpPeople = (session: Session, status: RsvpStatus): Person[] =>
  rsvpIds(session, status)
    .map((id) => peopleById[id])
    .filter(Boolean)

export const goingCount = (session: Session) => rsvpIds(session, 'going').length
export const myRsvp = (session: Session): RsvpStatus | undefined => session.rsvps[VIEWER_ID]

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
    () => state.groups.filter((g) => g.creatorId === VIEWER_ID),
    [state.groups],
  )
}

/** Sessions for one group, split into upcoming (soonest first) and past (newest first). */
export function useGroupSessions(groupId: string | undefined) {
  const { state } = useApp()
  return React.useMemo(() => {
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

/** Groups the viewer hasn't joined, ranked so their own courses surface first. */
export function useSuggestedGroups(limit = 2) {
  const { state } = useApp()
  return React.useMemo(() => {
    const enrolled = new Set(state.profile.courses)
    return state.groups
      .filter((g) => !isMember(g) && !isFull(g))
      .sort((a, b) => {
        const aMine = enrolled.has(a.courseCode) ? 0 : 1
        const bMine = enrolled.has(b.courseCode) ? 0 : 1
        if (aMine !== bMine) return aMine - bMine
        return b.memberIds.length - a.memberIds.length
      })
      .slice(0, limit)
  }, [state.groups, state.profile.courses, limit])
}

/** The right-rail activity feed: recent messages and newly scheduled sessions. */
export type ActivityItem = {
  id: string
  kind: 'message' | 'session'
  actorId: string
  groupId: string
  groupName: string
  text: string
  at: string
}

export function useActivity(limit = 4) {
  const { state } = useApp()
  return React.useMemo(() => {
    const mine = state.groups.filter(isMember)
    const names = new Map(mine.map((g) => [g.id, g.name]))

    const fromMessages: ActivityItem[] = state.messages
      .filter((m) => names.has(m.groupId) && m.authorId !== VIEWER_ID)
      .map((m) => ({
        id: `a-${m.id}`,
        kind: 'message' as const,
        actorId: m.authorId,
        groupId: m.groupId,
        groupName: names.get(m.groupId)!,
        text: m.body,
        at: m.sentAt,
      }))

    const fromSessions: ActivityItem[] = state.sessions
      .filter((s) => names.has(s.groupId) && s.organizerId !== VIEWER_ID)
      .map((s) => ({
        id: `a-${s.id}`,
        kind: 'session' as const,
        actorId: s.organizerId,
        groupId: s.groupId,
        groupName: names.get(s.groupId)!,
        text: `scheduled ${s.title}`,
        at: s.createdAt ?? s.startsAt,
      }))

    return [...fromMessages, ...fromSessions]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit)
  }, [state.groups, state.messages, state.sessions, limit])
}

/** Course-level rollups for the course page and discover chips. */
export function useCourseStats(courseCode: string) {
  const { state } = useApp()
  return React.useMemo(() => {
    const groupsInCourse = state.groups.filter((g) => g.courseCode === courseCode)
    const studentIds = new Set(groupsInCourse.flatMap((g) => g.memberIds))
    const groupIds = new Set(groupsInCourse.map((g) => g.id))
    const upcomingSessions = state.sessions
      .filter((s) => groupIds.has(s.groupId) && upcoming(s))
      .sort(byStart)
    return {
      groups: groupsInCourse,
      studentCount: studentIds.size,
      upcomingSessions,
    }
  }, [state.groups, state.sessions, courseCode])
}
