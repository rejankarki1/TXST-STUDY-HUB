import { describe, expect, it } from 'vitest'
import {
  EMPTY_REQUEST_FILTERS,
  bestTimeOption,
  canJoin,
  filterRequests,
  isFull,
  myTimeOptionIds,
  spotsLeft,
  toggleTimeOption,
} from './requests'
import { studyRequest, timeOption } from '@/test/factories'

const hours = (n: number) => new Date(Date.now() + n * 3600_000).toISOString()

describe('capacity', () => {
  it('counts the creator against the limit', () => {
    const request = studyRequest({ maxParticipants: 4, participantCount: 1 })
    expect(spotsLeft(request)).toBe(3)
    expect(isFull(request)).toBe(false)
  })

  it('reports full when the limit is reached', () => {
    const request = studyRequest({ maxParticipants: 3, participantCount: 3 })
    expect(spotsLeft(request)).toBe(0)
    expect(isFull(request)).toBe(true)
  })

  it('never reports negative spots if the server over-counts', () => {
    expect(spotsLeft(studyRequest({ maxParticipants: 2, participantCount: 5 }))).toBe(0)
  })
})

describe('canJoin mirrors the server rules', () => {
  it('allows an open request with room', () => {
    expect(canJoin(studyRequest())).toBe(true)
  })

  it('refuses a request you already joined', () => {
    expect(canJoin(studyRequest({ hasJoined: true }))).toBe(false)
  })

  it('refuses your own request', () => {
    expect(canJoin(studyRequest({ isCreator: true }))).toBe(false)
  })

  it('refuses a full request', () => {
    expect(canJoin(studyRequest({ maxParticipants: 2, participantCount: 2 }))).toBe(false)
  })

  it.each(['CONVERTED', 'CANCELLED', 'EXPIRED', 'MATCHED'] as const)(
    'refuses a %s request',
    (status) => {
      expect(canJoin(studyRequest({ status }))).toBe(false)
    },
  )
})

describe('filterRequests', () => {
  const needHelp = studyRequest({ id: 'a', intent: 'NEED_HELP', topic: 'Pointer diagrams' })
  const canHelp = studyRequest({
    id: 'b',
    intent: 'CAN_HELP',
    meetingStyle: 'ONLINE',
    topic: 'Big-O analysis',
  })
  const full = studyRequest({
    id: 'c',
    intent: 'REVIEW_TOGETHER',
    topic: 'Induction proofs',
    maxParticipants: 2,
    participantCount: 2,
  })
  const all = [needHelp, canHelp, full]

  it('returns everything with empty filters', () => {
    expect(filterRequests(all, EMPTY_REQUEST_FILTERS)).toHaveLength(3)
  })

  it('filters by intent', () => {
    const result = filterRequests(all, { ...EMPTY_REQUEST_FILTERS, intent: 'CAN_HELP' })
    expect(result.map((r) => r.id)).toEqual(['b'])
  })

  it('filters by meeting style', () => {
    const result = filterRequests(all, { ...EMPTY_REQUEST_FILTERS, meetingStyle: 'ONLINE' })
    expect(result.map((r) => r.id)).toEqual(['b'])
  })

  it('hides full requests when open spots are required', () => {
    const result = filterRequests(all, { ...EMPTY_REQUEST_FILTERS, openSpotsOnly: true })
    expect(result.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('searches topic text case-insensitively', () => {
    const result = filterRequests(all, { ...EMPTY_REQUEST_FILTERS, search: 'BIG-O' })
    expect(result.map((r) => r.id)).toEqual(['b'])
  })

  it('searches the creator name', () => {
    const result = filterRequests(all, { ...EMPTY_REQUEST_FILTERS, search: 'maya' })
    expect(result).toHaveLength(3)
  })

  it('keeps only requests with a window inside the "today" range', () => {
    const soon = studyRequest({ id: 'soon', timeOptions: [timeOption({ startsAt: hours(1), endsAt: hours(3) })] })
    const later = studyRequest({ id: 'later', timeOptions: [timeOption({ startsAt: hours(72), endsAt: hours(74) })] })

    const result = filterRequests([soon, later], { ...EMPTY_REQUEST_FILTERS, when: 'TODAY' })
    expect(result.map((r) => r.id)).toEqual(['soon'])
  })

  it('includes next-week windows under "this week"', () => {
    const later = studyRequest({ id: 'later', timeOptions: [timeOption({ startsAt: hours(72), endsAt: hours(74) })] })
    const result = filterRequests([later], { ...EMPTY_REQUEST_FILTERS, when: 'THIS_WEEK' })
    expect(result).toHaveLength(1)
  })

  it('ignores windows already in the past', () => {
    const past = studyRequest({ id: 'past', timeOptions: [timeOption({ startsAt: hours(-5), endsAt: hours(-3) })] })
    expect(filterRequests([past], { ...EMPTY_REQUEST_FILTERS, when: 'THIS_WEEK' })).toHaveLength(0)
  })
})

describe('toggleTimeOption', () => {
  it('adds an unselected option', () => {
    expect(toggleTimeOption(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes a selected option', () => {
    expect(toggleTimeOption(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('refuses to clear the last selection, because an empty availability is rejected', () => {
    expect(toggleTimeOption(['a'], 'a')).toEqual(['a'])
  })
})

describe('bestTimeOption', () => {
  it('picks the window the most people can make', () => {
    const options = [
      timeOption({ id: 'x', availableCount: 1 }),
      timeOption({ id: 'y', availableCount: 3 }),
    ]
    expect(bestTimeOption(options)?.id).toBe('y')
  })

  it('breaks a tie by the earlier start', () => {
    const options = [
      timeOption({ id: 'late', availableCount: 2, startsAt: hours(48) }),
      timeOption({ id: 'early', availableCount: 2, startsAt: hours(24) }),
    ]
    expect(bestTimeOption(options)?.id).toBe('early')
  })

  it('returns undefined with no options', () => {
    expect(bestTimeOption([])).toBeUndefined()
  })
})

describe('myTimeOptionIds', () => {
  it('returns only the windows the viewer marked', () => {
    const request = studyRequest({
      timeOptions: [
        timeOption({ id: '1', selectedByMe: true }),
        timeOption({ id: '2', selectedByMe: false }),
        timeOption({ id: '3', selectedByMe: true }),
      ],
    })
    expect(myTimeOptionIds(request)).toEqual(['1', '3'])
  })
})
