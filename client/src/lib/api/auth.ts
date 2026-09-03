import { del, get, patch, post, query, setAccessToken } from './client'
import type { AuthPayload, CurrentUser } from './types'

export const authApi = {
  signup(input: { name: string; email: string; password: string }) {
    return post<AuthPayload>('/auth/signup', input, { auth: false })
  },

  login(input: { email: string; password: string }) {
    return post<AuthPayload>('/auth/login', input, { auth: false })
  },

  demo() {
    return post<AuthPayload>('/auth/demo', undefined, { auth: false })
  },

  async logout() {
    await post<{ loggedOut: boolean }>('/auth/logout', undefined, { auth: false }).catch(
      () => undefined,
    )
    setAccessToken(null)
  },

  me() {
    return get<{ user: CurrentUser }>('/auth/me')
  },

  /** Profile edits and onboarding are the same call; sending major + gradYear +
   *  courseCodes together is what marks onboarding complete. */
  updateMe(input: {
    name?: string
    major?: string
    gradYear?: number
    studyProfileVisible?: boolean
    courseCodes?: string[]
  }) {
    return patch<{ user: CurrentUser }>('/auth/me', input)
  },
}

export const meApi = {
  addCourse(courseId: string) {
    return post<{ user: CurrentUser }>(`/courses/${courseId}/join`)
  },

  removeCourse(courseId: string) {
    return del<{ user: CurrentUser }>(`/courses/${courseId}/leave`)
  },
}

export { query }
