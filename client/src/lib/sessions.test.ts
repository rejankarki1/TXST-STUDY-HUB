import { describe, expect, it } from 'vitest'
import { groupByDay, groupSessions, isUpcoming } from './sessions'
import { session } from '@/test/factories'

const hours = (n: number) => new Date(Date.now() + n * 3600_000).toISOString()

const ME = 'user-me'

describe('isUpcoming', () => {
  it('is true for a planned session in the future', () => {
    expect(isUpcoming(session({ startsAt: hours(5) }))).toBe(true)
  })

  it('is false once the start time has passed', () => {
    expect(isUpcoming(session({ startsAt: hours(-1) }))).toBe(false)
  })

  it('is false for a cancelled session even in the future', () => {
    expect(isUpcoming(session({ startsAt: hours(5), status: 'CANCELLED' }))).toBe(false)
  })
})

describe('groupSessions', () => {
  const upcoming = session({ id: 'up', startsAt: hours(24), endsAt: hours(26) })
  const stale = session({ id: 'stale', startsAt: hours(-30), endsAt: hours(-28) })
  const done = session({ id: 'done', startsAt: hours(-72), status: 'COMPLETED' })
  const dropped = session({ id: 'dropped', startsAt: hours(48), status: 'CANCELLED' })
  const mine = session({ id: 'mine', startsAt: hours(12), organizerId: ME })

  const grouped = groupSessions([upcoming, stale, done, dropped, mine], ME)

  it('sorts upcoming soonest first', () => {
    expect(grouped.upcoming.map((s) => s.id)).toEqual(['mine', 'up'])
  })

  it('separates sessions that started but were never wrapped up', () => {
    expect(grouped.awaitingWrapUp.map((s) => s.id)).toEqual(['stale'])
  })

  it('keeps completed and cancelled apart', () => {
    expect(grouped.completed.map((s) => s.id)).toEqual(['done'])
    expect(grouped.cancelled.map((s) => s.id)).toEqual(['dropped'])
  })

  it('lists only sessions the viewer organises under organizing', () => {
    expect(grouped.organizing.map((s) => s.id)).toEqual(['mine'])
  })

  it('flags sessions still waiting on the viewer, excluding ones they organise', () => {
    expect(grouped.needsRsvp.map((s) => s.id)).toEqual(['up'])
  })

  it('treats MAYBE as still needing an answer', () => {
    const maybe = session({ id: 'maybe', startsAt: hours(10), myRsvp: 'MAYBE' })
    expect(groupSessions([maybe], ME).needsRsvp.map((s) => s.id)).toEqual(['maybe'])
  })

  it('treats GOING as answered', () => {
    const going = session({ id: 'going', startsAt: hours(10), myRsvp: 'GOING' })
    expect(groupSessions([going], ME).needsRsvp).toHaveLength(0)
  })
})

describe('groupByDay', () => {
  it('collapses consecutive sessions on the same day into one group', () => {
    const a = session({ id: 'a', startsAt: hours(2) })
    const b = session({ id: 'b', startsAt: hours(4) })
    const days = groupByDay([a, b])

    expect(days).toHaveLength(1)
    expect(days[0].sessions.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('starts a new group when the day changes', () => {
    const today = session({ id: 'today', startsAt: hours(2) })
    const later = session({ id: 'later', startsAt: hours(30) })
    expect(groupByDay([today, later]).length).toBeGreaterThan(1)
  })
})
