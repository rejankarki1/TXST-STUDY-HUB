import { del, get, patch, post, put, query } from './client'
import type { ApiSession, ApiStudyRequest } from './types'
import type { MeetingStyle, SessionMode, StudyRequestIntent } from '@/lib/contracts'

export type StudyRequestFilters = {
  search?: string
  intent?: StudyRequestIntent
  meetingStyle?: MeetingStyle
  from?: string
  to?: string
  openSpotsOnly?: boolean
  status?: string
}

export type NewStudyRequest = {
  topic: string
  details?: string
  intent: StudyRequestIntent
  meetingStyle: MeetingStyle
  location?: string
  maxParticipants: number
  timeOptions: { startsAt: string; endsAt: string }[]
  expiresAt?: string
}

export const studyRequestsApi = {
  listForCourse(courseId: string, filters: StudyRequestFilters = {}) {
    return get<{ studyRequests: ApiStudyRequest[] }>(
      `/courses/${courseId}/study-requests${query({ ...filters })}`,
    )
  },

  /** Open requests in My Courses that the student has not already joined. */
  opportunities() {
    return get<{ studyRequests: ApiStudyRequest[] }>('/study-requests/opportunities')
  },

  mine() {
    return get<{ studyRequests: ApiStudyRequest[] }>('/study-requests/mine')
  },

  get(requestId: string) {
    return get<{ studyRequest: ApiStudyRequest }>(`/study-requests/${requestId}`)
  },

  create(courseId: string, input: NewStudyRequest) {
    return post<{ studyRequest: ApiStudyRequest }>(`/courses/${courseId}/study-requests`, input)
  },

  update(requestId: string, input: Partial<NewStudyRequest>) {
    return patch<{ studyRequest: ApiStudyRequest }>(`/study-requests/${requestId}`, input)
  },

  join(requestId: string, timeOptionIds: string[]) {
    return post<{ studyRequest: ApiStudyRequest }>(`/study-requests/${requestId}/join`, {
      timeOptionIds,
    })
  },

  setAvailability(requestId: string, timeOptionIds: string[]) {
    return put<{ studyRequest: ApiStudyRequest }>(`/study-requests/${requestId}/availability`, {
      timeOptionIds,
    })
  },

  withdraw(requestId: string) {
    return del<{ studyRequest: ApiStudyRequest }>(`/study-requests/${requestId}/join`)
  },

  cancel(requestId: string) {
    return patch<{ studyRequest: ApiStudyRequest }>(`/study-requests/${requestId}/cancel`)
  },

  convertToSession(
    requestId: string,
    input: {
      timeOptionId: string
      title?: string
      description?: string
      agenda?: string
      mode: SessionMode
      location: string
      locationDetail?: string
      meetingLink?: string
    },
  ) {
    return post<{ session: ApiSession; studyRequest: ApiStudyRequest }>(
      `/study-requests/${requestId}/convert-to-session`,
      input,
    )
  },
}
