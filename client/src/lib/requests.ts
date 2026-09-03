import type { ApiStudyRequest, ApiTimeOption } from '@/lib/api'
import type { MeetingStyle, StudyRequestIntent } from '@/lib/contracts'

export type RequestFilterState = {
  search: string
  intent: StudyRequestIntent | 'ALL'
  meetingStyle: MeetingStyle | 'ALL'
  when: 'ALL' | 'TODAY' | 'THIS_WEEK'
  openSpotsOnly: boolean
}

export const EMPTY_REQUEST_FILTERS: RequestFilterState = {
  search: '',
  intent: 'ALL',
  meetingStyle: 'ALL',
  when: 'ALL',
  openSpotsOnly: false,
}

/** Spots left, counting the creator, floored at zero. */
export function spotsLeft(request: Pick<ApiStudyRequest, 'maxParticipants' | 'participantCount'>) {
  return Math.max(request.maxParticipants - request.participantCount, 0)
}

export function isFull(request: Pick<ApiStudyRequest, 'maxParticipants' | 'participantCount'>) {
  return spotsLeft(request) === 0
}

/**
 * Can the current student act on this request?
 *
 * Mirrors the server's join rules exactly, so the UI never offers a button the
 * API is going to reject: open, not already joined, not your own, not full.
 */
export function canJoin(request: ApiStudyRequest) {
  return request.status === 'OPEN' && !request.hasJoined && !request.isCreator && !isFull(request)
}

function withinWindow(request: ApiStudyRequest, when: RequestFilterState['when'], now: Date) {
  if (when === 'ALL') return true

  const end = new Date(now)
  if (when === 'TODAY') {
    end.setHours(23, 59, 59, 999)
  } else {
    end.setDate(end.getDate() + 7)
  }

  return request.timeOptions.some((option) => {
    const start = new Date(option.startsAt)
    return start >= now && start <= end
  })
}

/**
 * The Study tab's filter. Pure and exported so the same rules can be unit
 * tested without mounting a page.
 */
export function filterRequests(
  requests: ApiStudyRequest[],
  filters: RequestFilterState,
  now: Date = new Date(),
) {
  const search = filters.search.trim().toLowerCase()

  return requests.filter((request) => {
    if (filters.intent !== 'ALL' && request.intent !== filters.intent) return false
    if (filters.meetingStyle !== 'ALL' && request.meetingStyle !== filters.meetingStyle) {
      return false
    }
    if (filters.openSpotsOnly && isFull(request)) return false
    if (!withinWindow(request, filters.when, now)) return false

    if (search) {
      const haystack = [request.topic, request.details ?? '', request.creator.name]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(search)) return false
    }

    return true
  })
}

/**
 * Toggle one proposed window in a selection.
 *
 * Kept out of the component because "you must keep at least one" is a rule, not
 * a rendering detail: deselecting your last time would submit an empty
 * availability the server rejects.
 */
export function toggleTimeOption(selected: string[], optionId: string) {
  if (selected.includes(optionId)) {
    const next = selected.filter((id) => id !== optionId)
    return next.length === 0 ? selected : next
  }

  return [...selected, optionId]
}

/** The window the most people can make — what the organiser should confirm. */
export function bestTimeOption(options: ApiTimeOption[]): ApiTimeOption | undefined {
  if (options.length === 0) return undefined

  return options.toSorted((a, b) => {
    if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  })[0]
}

export const myTimeOptionIds = (request: ApiStudyRequest) =>
  request.timeOptions.filter((option) => option.selectedByMe).map((option) => option.id)
