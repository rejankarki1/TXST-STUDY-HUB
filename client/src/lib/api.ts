const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[] | undefined>
}

export type ApiCourse = {
  id: string
  code: string
  title: string
  description?: string | null
  questionCount?: number
  department?: {
    id: string
    code: string
    name: string
  } | null
}

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN'
  major: string | null
  gradYear: number | null
  onboardingCompleted: boolean
  courses: ApiCourse[]
}

export type AuthPayload = {
  user: CurrentUser
  accessToken: string
}

export type ApiStudyGroupMember = {
  id: string
  name: string
  major?: string | null
  gradYear?: number | null
  joinedAt?: string
}

export type ApiStudyGroup = {
  id: string
  name: string
  description: string
  purpose: 'Exam prep' | 'Homework' | 'Weekly studying' | 'Project work' | 'General study'
  meetingStyle: 'in-person' | 'online' | 'flexible'
  maxMembers: number
  courseId: string
  courseCode: string
  creatorId: string
  createdAt: string
  updatedAt: string
  course: ApiCourse
  creator: ApiStudyGroupMember
  members: ApiStudyGroupMember[]
  memberCount: number
  spotsLeft: number
  isFull: boolean
  isMember: boolean
  isCreator: boolean
}

export type ApiSessionAttendee = {
  id: string
  name: string
  major?: string | null
  gradYear?: number | null
  status: 'going' | 'maybe' | 'cant'
  rsvpUpdatedAt?: string
}

export type ApiStudySession = {
  id: string
  groupId: string
  organizerId: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  mode: 'in-person' | 'online'
  location: string
  locationDetail?: string | null
  meetingLink?: string | null
  createdAt: string
  updatedAt: string
  organizer: ApiStudyGroupMember
  group: {
    id: string
    name: string
    course: {
      id: string
      code: string
      title: string
    }
  }
  attendees: ApiSessionAttendee[]
  myRsvp?: 'going' | 'maybe' | 'cant'
  goingCount: number
  maybeCount: number
  cantCount: number
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
) {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unexpected server response',
  }))) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? 'Request failed')
  }

  if (!payload.data) {
    throw new Error('Response data missing')
  }

  return payload.data
}

export const api = {
  signup(input: { name: string; email: string; password: string }) {
    return apiRequest<AuthPayload>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  login(input: { email: string; password: string }) {
    return apiRequest<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  refresh() {
    return apiRequest<AuthPayload>('/auth/refresh', {
      method: 'POST',
    })
  },

  logout() {
    return fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  },

  me(token: string) {
    return apiRequest<{ user: CurrentUser }>('/auth/me', {
      token,
    })
  },

  completeOnboarding(
    token: string,
    input: {
      name?: string
      major: string
      gradYear: number
      courseCodes: string[]
    },
  ) {
    return apiRequest<{ user: CurrentUser }>('/auth/onboarding', {
      method: 'POST',
      token,
      body: JSON.stringify(input),
    })
  },

  listCourses(search?: string) {
    const params = new URLSearchParams()
    if (search?.trim()) params.set('search', search.trim())
    const query = params.toString()
    return apiRequest<{ courses: ApiCourse[] }>(`/courses${query ? `?${query}` : ''}`)
  },

  getCourse(id: string) {
    return apiRequest<{ course: ApiCourse }>(`/courses/${id}`)
  },

  listStudyGroups(token: string, input: { courseId?: string; search?: string } = {}) {
    const params = new URLSearchParams()
    if (input.courseId) params.set('courseId', input.courseId)
    if (input.search?.trim()) params.set('search', input.search.trim())
    const query = params.toString()
    return apiRequest<{ studyGroups: ApiStudyGroup[] }>(
      `/study-groups${query ? `?${query}` : ''}`,
      { token },
    )
  },

  listMyStudyGroups(token: string) {
    return apiRequest<{ studyGroups: ApiStudyGroup[] }>('/study-groups/mine', { token })
  },

  listCourseStudyGroups(token: string, courseId: string) {
    return apiRequest<{ studyGroups: ApiStudyGroup[] }>(
      `/courses/${courseId}/study-groups`,
      { token },
    )
  },

  getStudyGroup(token: string, groupId: string) {
    return apiRequest<{ studyGroup: ApiStudyGroup }>(`/study-groups/${groupId}`, { token })
  },

  listStudyGroupMembers(token: string, groupId: string) {
    return apiRequest<{ members: ApiStudyGroupMember[] }>(
      `/study-groups/${groupId}/members`,
      { token },
    )
  },

  createStudyGroup(
    token: string,
    input: {
      courseId: string
      name: string
      description: string
      purpose: ApiStudyGroup['purpose']
      meetingStyle: ApiStudyGroup['meetingStyle']
      maxMembers: number
    },
  ) {
    return apiRequest<{ studyGroup: ApiStudyGroup }>('/study-groups', {
      method: 'POST',
      token,
      body: JSON.stringify(input),
    })
  },

  joinStudyGroup(token: string, groupId: string) {
    return apiRequest<{ studyGroup: ApiStudyGroup }>(`/study-groups/${groupId}/join`, {
      method: 'POST',
      token,
    })
  },

  leaveStudyGroup(token: string, groupId: string) {
    return apiRequest<{ studyGroup: ApiStudyGroup }>(
      `/study-groups/${groupId}/membership`,
      {
        method: 'DELETE',
        token,
      },
    )
  },

  listGroupSessions(token: string, groupId: string) {
    return apiRequest<{ studySessions: ApiStudySession[] }>(
      `/study-groups/${groupId}/sessions`,
      { token },
    )
  },

  createStudySession(
    token: string,
    groupId: string,
    input: {
      title: string
      description: string
      startsAt: string
      endsAt: string
      mode: ApiStudySession['mode']
      location: string
      locationDetail?: string
      meetingLink?: string
    },
  ) {
    return apiRequest<{ studySession: ApiStudySession }>(
      `/study-groups/${groupId}/sessions`,
      {
        method: 'POST',
        token,
        body: JSON.stringify(input),
      },
    )
  },

  listMySessions(token: string) {
    return apiRequest<{ studySessions: ApiStudySession[] }>('/sessions/mine', { token })
  },

  getSession(token: string, sessionId: string) {
    return apiRequest<{ studySession: ApiStudySession }>(`/sessions/${sessionId}`, { token })
  },

  setSessionRsvp(token: string, sessionId: string, status: ApiSessionAttendee['status']) {
    return apiRequest<{ studySession: ApiStudySession }>(`/sessions/${sessionId}/rsvp`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status }),
    })
  },
}
