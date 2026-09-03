import { describe, expect, it } from 'vitest'
import { defaultSlot, isFuture, isoToLocalInput, localInputToIso, toLocalInputValue } from './datetime'

describe('datetime-local bridging', () => {
  it('formats a Date as the value the input expects', () => {
    const date = new Date(2026, 8, 10, 17, 5)
    expect(toLocalInputValue(date)).toBe('2026-09-10T17:05')
  })

  it('zero-pads single-digit months, days, hours and minutes', () => {
    expect(toLocalInputValue(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02T03:04')
  })

  /* The whole point of this module: a 5 PM slot has to stay 5 PM for the person
     who picked it, which means the local value carries the offset on the way out
     and comes back to the same wall-clock time. */
  it('round-trips local wall-clock time through ISO', () => {
    const local = '2026-09-10T17:00'
    const iso = localInputToIso(local)

    expect(iso).not.toBeNull()
    expect(isoToLocalInput(iso!)).toBe(local)
  })

  it('returns null for an empty or unparseable value', () => {
    expect(localInputToIso('')).toBeNull()
    expect(localInputToIso('not-a-date')).toBeNull()
  })
})

describe('defaultSlot', () => {
  it('produces a window the requested number of days out', () => {
    const slot = defaultSlot(2, 18, 2)
    const start = new Date(slot.startsAt)
    const end = new Date(slot.endsAt)

    expect(start.getHours()).toBe(18)
    expect(end.getTime() - start.getTime()).toBe(2 * 3600_000)
  })

  it('defaults to a future window', () => {
    expect(isFuture(defaultSlot(1).startsAt)).toBe(true)
  })
})

describe('isFuture', () => {
  it('is false for a past value', () => {
    const past = new Date(Date.now() - 3600_000)
    expect(isFuture(toLocalInputValue(past))).toBe(false)
  })

  it('is false for an empty value', () => {
    expect(isFuture('')).toBe(false)
  })
})
