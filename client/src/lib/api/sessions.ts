import { get, patch, put } from './client'
import type { ApiSession } from './types'
import type { RsvpStatus } from '@/lib/contracts'
import type { NewSessionInput } from './circles'

export const sessionsApi = {
  mine() {
    return get<{ sessions: ApiSession[] }>('/sessions/mine')
  },

  forCourse(courseId: string) {
    return get<{ sessions: ApiSession[] }>(`/courses/${courseId}/sessions`)
  },

  get(sessionId: string) {
    return get<{ session: ApiSession }>(`/sessions/${sessionId}`)
  },

  update(sessionId: string, input: Partial<NewSessionInput>) {
    return patch<{ session: ApiSession }>(`/sessions/${sessionId}`, input)
  },

  setRsvp(sessionId: string, status: RsvpStatus) {
    return put<{ session: ApiSession }>(`/sessions/${sessionId}/rsvp`, { status })
  },

  cancel(sessionId: string) {
    return patch<{ session: ApiSession }>(`/sessions/${sessionId}/cancel`)
  },

  /** saveAsQuestion is the explicit confirmation that turns an unresolved
   *  question into a Course Question. Without it nothing is posted. */
  complete(
    sessionId: string,
    input: {
      topicsCompleted?: string
      recap?: string
      unresolvedQuestion?: string
      unresolvedQuestionDetails?: string
      saveAsQuestion?: boolean
    },
  ) {
    return patch<{ session: ApiSession; questionId: string | null }>(
      `/sessions/${sessionId}/complete`,
      input,
    )
  },
}
