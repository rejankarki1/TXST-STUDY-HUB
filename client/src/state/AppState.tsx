import * as React from 'react'
import { toast } from 'sonner'
import type {
  Group,
  GroupMember,
  GroupPurpose,
  MeetingStyle,
  Message,
  Notification,
  RsvpStatus,
  Session,
} from '@/data/types'
import { groups as seedGroups } from '@/data/groups'
import { sessions as seedSessions } from '@/data/sessions'
import { messages as seedMessages, initialUnread } from '@/data/messages'
import { notifications as seedNotifications } from '@/data/notifications'
import { defaultEnrolledCourses } from '@/data/courses'
import { VIEWER_ID, peopleById } from '@/data/people'
import { nextReply } from '@/data/replies'
import { plusMinutes } from '@/data/time'
import {
  api,
  ApiError,
  type ApiCourse,
  type ApiDepartment,
  type ApiStudyGroup,
  type ApiStudySession,
  type CurrentUser,
} from '@/lib/api'

/* ------------------------------------------------------------------ types */

export type Profile = {
  name: string
  email: string
  major: string
  gradYear: number
  courses: string[]
  courseDetails: ApiCourse[]
}

export type AppState = {
  signedIn: boolean
  onboarded: boolean
  authLoading: boolean
  authError: string | null
  accessToken: string | null
  currentUser: CurrentUser | null
  demoMode: boolean
  courses: ApiCourse[]
  coursesLoading: boolean
  coursesError: string | null
  departments: ApiDepartment[]
  groupsLoading: boolean
  groupsError: string | null
  sessionsLoading: boolean
  sessionsError: string | null
  profile: Profile
  groups: Group[]
  sessions: Session[]
  messages: Message[]
  notifications: Notification[]
  unread: Record<string, number>
  /** Group id where a mock member is currently "typing". */
  typingIn: string | null
  replyTurn: Record<string, number>
}

type Action =
  | { type: 'AUTH_LOADING'; loading: boolean }
  | { type: 'AUTH_SUCCESS'; user: CurrentUser; accessToken: string }
  | { type: 'AUTH_FAILURE'; message?: string }
  | { type: 'COURSES_LOADING'; loading: boolean }
  | { type: 'COURSES_SUCCESS'; courses: ApiCourse[] }
  | { type: 'COURSES_FAILURE'; message: string }
  | { type: 'COURSES_UPSERT'; courses: ApiCourse[] }
  | { type: 'DEPARTMENTS_SUCCESS'; departments: ApiDepartment[] }
  | { type: 'PROFILE_COURSES_SUCCESS'; courses: ApiCourse[] }
  | { type: 'GROUPS_LOADING'; loading: boolean }
  | { type: 'GROUPS_SUCCESS'; groups: Group[] }
  | { type: 'GROUPS_FAILURE'; message: string }
  | { type: 'UPSERT_GROUP'; group: Group }
  | { type: 'UPSERT_GROUPS'; groups: Group[] }
  | { type: 'REMOVE_GROUP'; groupId: string }
  | { type: 'SESSIONS_LOADING'; loading: boolean }
  | { type: 'SESSIONS_SUCCESS'; sessions: Session[] }
  | { type: 'SESSIONS_FAILURE'; message: string }
  | { type: 'UPSERT_SESSION'; session: Session }
  | { type: 'UPSERT_SESSIONS'; sessions: Session[] }
  | { type: 'SIGN_OUT' }
  | { type: 'ENTER_DEMO' }
  | { type: 'SET_RSVP'; sessionId: string; status: RsvpStatus }
  | { type: 'SEND_MESSAGE'; message: Message }
  | { type: 'RECEIVE_MESSAGE'; message: Message }
  | { type: 'SET_TYPING'; groupId: string | null }
  | { type: 'CREATE_SESSION'; session: Session }
  | { type: 'MARK_GROUP_READ'; groupId: string }
  | { type: 'MARK_NOTIFICATIONS_READ' }

/* --------------------------------------------------------------- initial */

const DEMO_PROFILE: Profile = {
  name: peopleById[VIEWER_ID].name,
  email: 'rejan.karki@txstate.edu',
  major: 'Computer Science',
  gradYear: 2029,
  courses: defaultEnrolledCourses,
  courseDetails: [],
}

const EMPTY_PROFILE: Profile = {
  name: '',
  email: '',
  major: '',
  gradYear: new Date().getFullYear() + 3,
  courses: [],
  courseDetails: [],
}

function profileFromUser(user: CurrentUser): Profile {
  return {
    name: user.name ?? user.email,
    email: user.email,
    major: user.major ?? '',
    gradYear: user.gradYear ?? new Date().getFullYear() + 3,
    courses: user.courses.map((course) => course.code),
    courseDetails: user.courses,
  }
}

/**
 * Chat, notifications, and unread have no backend yet. The seeded versions belong
 * to demo mode only — a real account must never be shown fabricated activity, and
 * those fixtures reference demo ids (g1, s1) that do not resolve for real users.
 * See ENTER_DEMO, which is where the seeded data is applied.
 */
const collaborationState = {
  sessions: [],
  messages: [],
  notifications: [],
  unread: {},
  typingIn: null,
  replyTurn: {},
}

const demoCollaborationState = {
  messages: seedMessages,
  notifications: seedNotifications,
  unread: initialUnread,
}

const initialState: AppState = {
  signedIn: false,
  onboarded: false,
  authLoading: true,
  authError: null,
  accessToken: null,
  currentUser: null,
  demoMode: false,
  courses: [],
  coursesLoading: true,
  coursesError: null,
  departments: [],
  groups: [],
  groupsLoading: false,
  groupsError: null,
  sessionsLoading: false,
  sessionsError: null,
  profile: EMPTY_PROFILE,
  ...collaborationState,
}

function groupFromApi(group: ApiStudyGroup): Group {
  return {
    id: group.id,
    name: group.name,
    courseId: group.courseId,
    courseCode: group.course.code,
    course: group.course,
    description: group.description,
    purpose: group.purpose,
    meetingStyle: group.meetingStyle,
    maxMembers: group.maxMembers,
    members: group.members,
    memberCount: group.memberCount,
    spotsLeft: group.spotsLeft,
    isFull: group.isFull,
    isMember: group.isMember,
    isCreator: group.isCreator,
    creatorId: group.creator.id,
    creator: group.creator,
    createdAt: group.createdAt,
  }
}

function demoMember(id: string): GroupMember | undefined {
  const person = peopleById[id]
  if (!person) return undefined
  return {
    id: person.id,
    name: person.name,
    major: person.major,
    gradYear: person.gradYear,
  }
}

function groupFromDemo(group: Group): Group {
  const members = group.memberIds?.map(demoMember).filter((member): member is GroupMember => Boolean(member)) ?? []
  return {
    ...group,
    members,
    memberCount: members.length,
    spotsLeft: Math.max(group.maxMembers - members.length, 0),
    isFull: members.length >= group.maxMembers,
    isMember: group.memberIds?.includes(VIEWER_ID) ?? false,
    isCreator: group.creatorId === VIEWER_ID,
    creator: demoMember(group.creatorId),
  }
}

function sessionFromApi(session: ApiStudySession): Session {
  return {
    id: session.id,
    groupId: session.groupId,
    title: session.title,
    description: session.description,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    mode: session.mode,
    location: session.location,
    locationDetail: session.locationDetail ?? undefined,
    meetingLink: session.meetingLink ?? undefined,
    organizerId: session.organizerId,
    organizer: session.organizer,
    group: session.group,
    attendees: session.attendees,
    myRsvp: session.myRsvp,
    goingCount: session.goingCount,
    maybeCount: session.maybeCount,
    cantCount: session.cantCount,
    createdAt: session.createdAt,
  }
}

function sessionFromDemo(session: Session): Session {
  const attendees =
    Object.entries(session.rsvps ?? {})
      .map(([id, status]) => {
        const person = peopleById[id]
        if (!person) return undefined
        return {
          id: person.id,
          name: person.name,
          major: person.major,
          gradYear: person.gradYear,
          status,
        }
      })
      .filter((attendee): attendee is NonNullable<typeof attendee> => Boolean(attendee)) ?? []

  return {
    ...session,
    attendees,
    myRsvp: session.rsvps?.[VIEWER_ID],
    goingCount: attendees.filter((attendee) => attendee.status === 'going').length,
    maybeCount: attendees.filter((attendee) => attendee.status === 'maybe').length,
    cantCount: attendees.filter((attendee) => attendee.status === 'cant').length,
  }
}

/* --------------------------------------------------------------- reducer */

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, authLoading: action.loading, authError: null }

    case 'AUTH_SUCCESS':
      return {
        ...state,
        signedIn: true,
        onboarded: action.user.onboardingCompleted,
        authLoading: false,
        authError: null,
        accessToken: action.accessToken,
        currentUser: action.user,
        demoMode: false,
        profile: profileFromUser(action.user),
      }

    case 'AUTH_FAILURE':
      return {
        ...state,
        signedIn: false,
        onboarded: false,
        authLoading: false,
        authError: action.message ?? null,
        accessToken: null,
        currentUser: null,
        demoMode: false,
        profile: EMPTY_PROFILE,
      }

    case 'COURSES_LOADING':
      return { ...state, coursesLoading: action.loading, coursesError: null }

    case 'COURSES_SUCCESS':
      return {
        ...state,
        courses: action.courses,
        coursesLoading: false,
        coursesError: null,
      }

    /* Merge, don't replace: state.courses is fetched once on mount, so a course
       created mid-session has to be folded in or nothing downstream sees it. */
    case 'COURSES_UPSERT': {
      const byId = new Map(state.courses.map((course) => [course.id, course]))
      for (const course of action.courses) byId.set(course.id, course)
      return {
        ...state,
        courses: [...byId.values()].sort((a, b) => a.code.localeCompare(b.code)),
      }
    }

    case 'DEPARTMENTS_SUCCESS':
      return { ...state, departments: action.departments }

    case 'COURSES_FAILURE':
      return {
        ...state,
        coursesLoading: false,
        coursesError: action.message,
      }

    case 'PROFILE_COURSES_SUCCESS':
      return {
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, courses: action.courses }
          : state.currentUser,
        profile: {
          ...state.profile,
          courses: action.courses.map((course) => course.code),
          courseDetails: action.courses,
        },
      }

    case 'GROUPS_LOADING':
      return { ...state, groupsLoading: action.loading, groupsError: null }

    case 'GROUPS_SUCCESS':
      return {
        ...state,
        groups: action.groups,
        groupsLoading: false,
        groupsError: null,
      }

    case 'GROUPS_FAILURE':
      return {
        ...state,
        groupsLoading: false,
        groupsError: action.message,
      }

    case 'UPSERT_GROUP':
      return {
        ...state,
        groups: state.groups.some((group) => group.id === action.group.id)
          ? state.groups.map((group) => (group.id === action.group.id ? action.group : group))
          : [action.group, ...state.groups],
        groupsLoading: false,
        groupsError: null,
      }

    case 'UPSERT_GROUPS': {
      const next = new Map(state.groups.map((group) => [group.id, group]))
      action.groups.forEach((group) => next.set(group.id, group))
      return {
        ...state,
        groups: [...next.values()],
        groupsLoading: false,
        groupsError: null,
      }
    }

    case 'REMOVE_GROUP':
      return {
        ...state,
        groups: state.groups.filter((group) => group.id !== action.groupId),
        sessions: state.sessions.filter((session) => session.groupId !== action.groupId),
        messages: state.messages.filter((message) => message.groupId !== action.groupId),
        notifications: state.notifications.filter((notification) => notification.groupId !== action.groupId),
      }

    case 'SESSIONS_LOADING':
      return { ...state, sessionsLoading: action.loading, sessionsError: null }

    case 'SESSIONS_SUCCESS':
      return {
        ...state,
        sessions: action.sessions,
        sessionsLoading: false,
        sessionsError: null,
      }

    case 'SESSIONS_FAILURE':
      return {
        ...state,
        sessionsLoading: false,
        sessionsError: action.message,
      }

    case 'UPSERT_SESSION':
      return {
        ...state,
        sessions: state.sessions.some((session) => session.id === action.session.id)
          ? state.sessions.map((session) =>
              session.id === action.session.id ? action.session : session,
            )
          : [action.session, ...state.sessions],
        sessionsLoading: false,
        sessionsError: null,
      }

    case 'UPSERT_SESSIONS': {
      const next = new Map(state.sessions.map((session) => [session.id, session]))
      action.sessions.forEach((session) => next.set(session.id, session))
      return {
        ...state,
        sessions: [...next.values()],
        sessionsLoading: false,
        sessionsError: null,
      }
    }

    case 'SIGN_OUT':
      return {
        ...initialState,
        courses: state.courses,
        coursesLoading: state.coursesLoading,
        coursesError: state.coursesError,
        departments: state.departments,
        authLoading: false,
      }

    /* "Skip to demo" — a fully populated account, no backend auth. */
    case 'ENTER_DEMO':
      return {
        ...state,
        signedIn: true,
        onboarded: true,
        authLoading: false,
        authError: null,
        accessToken: null,
        currentUser: null,
        demoMode: true,
        profile: DEMO_PROFILE,
        groups: seedGroups.map(groupFromDemo),
        sessions: seedSessions.map(sessionFromDemo),
        ...demoCollaborationState,
        groupsLoading: false,
        groupsError: null,
        sessionsLoading: false,
        sessionsError: null,
      }

    case 'SET_RSVP':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? { ...s, rsvps: { ...s.rsvps, [VIEWER_ID]: action.status } }
            : s,
        ),
      }

    case 'SEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }

    case 'RECEIVE_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
        typingIn: null,
        replyTurn: {
          ...state.replyTurn,
          [action.message.groupId]: (state.replyTurn[action.message.groupId] ?? 0) + 1,
        },
      }

    case 'SET_TYPING':
      return { ...state, typingIn: action.groupId }

    case 'CREATE_SESSION':
      return { ...state, sessions: [...state.sessions, action.session] }

    case 'MARK_GROUP_READ': {
      if (!state.unread[action.groupId]) return state
      const unread = { ...state.unread }
      delete unread[action.groupId]
      return { ...state, unread }
    }

    case 'MARK_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.read ? n : { ...n, read: true })),
      }

    default:
      return state
  }
}

/* ------------------------------------------------------------------- api */

let idSeq = 1000
const nextId = (prefix: string) => `${prefix}${++idSeq}`

export type NewCourseInput = {
  code: string
  title: string
  description?: string
  departmentId: string
}

export type NewGroupInput = {
  name: string
  courseId: string
  description: string
  purpose: GroupPurpose
  meetingStyle: MeetingStyle
  maxMembers: number
}

export type NewSessionInput = {
  groupId: string
  title: string
  description: string
  startsAt: string
  durationMinutes: number
  mode: 'in-person' | 'online'
  location: string
  locationDetail?: string
  meetingLink?: string
}

type AppApi = {
  state: AppState
  login: (input: { email: string; password: string }) => Promise<CurrentUser>
  signup: (input: { name: string; email: string; password: string }) => Promise<CurrentUser>
  signOut: () => Promise<void>
  enterDemo: () => void
  completeOnboarding: (input: {
    name?: string
    major: string
    gradYear: number
    courseCodes: string[]
  }) => Promise<CurrentUser>
  refreshGroups: () => Promise<void>
  refreshCourseGroups: (courseId: string) => Promise<void>
  refreshMyGroups: () => Promise<void>
  refreshGroup: (groupId: string) => Promise<void>
  refreshSessions: () => Promise<void>
  refreshGroupSessions: (groupId: string) => Promise<void>
  refreshSession: (sessionId: string) => Promise<void>
  refreshCurrentUser: () => Promise<CurrentUser>
  loadDepartments: () => Promise<void>
  createCourse: (input: NewCourseInput) => Promise<ApiCourse>
  addCourse: (courseId: string) => Promise<void>
  removeCourse: (courseId: string) => Promise<void>
  joinGroup: (groupId: string) => Promise<void>
  leaveGroup: (groupId: string) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  setRsvp: (sessionId: string, status: RsvpStatus) => Promise<void>
  sendMessage: (groupId: string, body: string) => void
  createGroup: (input: NewGroupInput) => Promise<string>
  createSession: (input: NewSessionInput) => Promise<string>
  markGroupRead: (groupId: string) => void
  markNotificationsRead: () => void
}

const AppContext = React.createContext<AppApi | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const stateRef = React.useRef(state)
  stateRef.current = state

  React.useEffect(() => {
    let active = true

    api
      .listCourses()
      .then(({ courses }) => {
        if (active) dispatch({ type: 'COURSES_SUCCESS', courses })
      })
      .catch((error) => {
        if (!active) return
        dispatch({
          type: 'COURSES_FAILURE',
          message: error instanceof Error ? error.message : 'Could not load courses',
        })
      })

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    let active = true

    api
      .refresh()
      .then(({ user, accessToken }) => {
        if (active) dispatch({ type: 'AUTH_SUCCESS', user, accessToken })
      })
      .catch(() => {
        if (active) dispatch({ type: 'AUTH_FAILURE' })
      })

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    if (!state.accessToken || state.demoMode) return
    let active = true

    dispatch({ type: 'GROUPS_LOADING', loading: true })
    api
      .listStudyGroups(state.accessToken)
      .then(({ studyGroups }) => {
        if (active) dispatch({ type: 'GROUPS_SUCCESS', groups: studyGroups.map(groupFromApi) })
      })
      .catch((error) => {
        if (!active) return
        dispatch({
          type: 'GROUPS_FAILURE',
          message: error instanceof Error ? error.message : 'Could not load study groups',
        })
      })

    return () => {
      active = false
    }
  }, [state.accessToken, state.demoMode])

  React.useEffect(() => {
    if (!state.accessToken || state.demoMode) return
    let active = true

    dispatch({ type: 'SESSIONS_LOADING', loading: true })
    api
      .listMySessions(state.accessToken)
      .then(({ studySessions }) => {
        if (active) {
          dispatch({
            type: 'SESSIONS_SUCCESS',
            sessions: studySessions.map(sessionFromApi),
          })
        }
      })
      .catch((error) => {
        if (!active) return
        dispatch({
          type: 'SESSIONS_FAILURE',
          message: error instanceof Error ? error.message : 'Could not load sessions',
        })
      })

    return () => {
      active = false
    }
  }, [state.accessToken, state.demoMode])

  /* Timers for the scripted chat reply; cleared if the provider unmounts. */
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([])
  React.useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const appApi = React.useMemo<AppApi>(() => {
    const later = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms))
    }

    return {
      state,

      login: async (input) => {
        const { user, accessToken } = await api.login(input)
        dispatch({ type: 'AUTH_SUCCESS', user, accessToken })
        return user
      },

      signup: async (input) => {
        const { user, accessToken } = await api.signup(input)
        dispatch({ type: 'AUTH_SUCCESS', user, accessToken })
        return user
      },

      signOut: async () => {
        if (!stateRef.current.demoMode) {
          await api.logout().catch(() => undefined)
        }
        dispatch({ type: 'SIGN_OUT' })
      },

      enterDemo: () => dispatch({ type: 'ENTER_DEMO' }),

      completeOnboarding: async (input) => {
        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        const { user } = await api.updateMe(token, input)
        dispatch({ type: 'AUTH_SUCCESS', user, accessToken: token })
        return user
      },

      refreshGroups: async () => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        dispatch({ type: 'GROUPS_LOADING', loading: true })
        try {
          const { studyGroups } = await api.listStudyGroups(token)
          dispatch({ type: 'GROUPS_SUCCESS', groups: studyGroups.map(groupFromApi) })
        } catch (error) {
          dispatch({
            type: 'GROUPS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load study groups',
          })
          throw error
        }
      },

      refreshCourseGroups: async (courseId) => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        try {
          const { studyGroups } = await api.listStudyGroups(token, { courseId })
          dispatch({ type: 'UPSERT_GROUPS', groups: studyGroups.map(groupFromApi) })
        } catch (error) {
          dispatch({
            type: 'GROUPS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load course groups',
          })
          throw error
        }
      },

      refreshMyGroups: async () => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        try {
          const { studyGroups } = await api.listMyStudyGroups(token)
          dispatch({ type: 'UPSERT_GROUPS', groups: studyGroups.map(groupFromApi) })
        } catch (error) {
          dispatch({
            type: 'GROUPS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load your study groups',
          })
          throw error
        }
      },

      refreshGroup: async (groupId) => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        try {
          const { studyGroup } = await api.getStudyGroup(token, groupId)
          dispatch({ type: 'UPSERT_GROUP', group: groupFromApi(studyGroup) })
        } catch (error) {
          dispatch({
            type: 'GROUPS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load study group',
          })
          throw error
        }
      },

      refreshSessions: async () => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        dispatch({ type: 'SESSIONS_LOADING', loading: true })
        try {
          const { studySessions } = await api.listMySessions(token)
          dispatch({
            type: 'SESSIONS_SUCCESS',
            sessions: studySessions.map(sessionFromApi),
          })
        } catch (error) {
          dispatch({
            type: 'SESSIONS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load sessions',
          })
          throw error
        }
      },

      refreshGroupSessions: async (groupId) => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        dispatch({ type: 'SESSIONS_LOADING', loading: true })
        try {
          const { studySessions } = await api.listGroupSessions(token, groupId)
          dispatch({
            type: 'UPSERT_SESSIONS',
            sessions: studySessions.map(sessionFromApi),
          })
        } catch (error) {
          dispatch({
            type: 'SESSIONS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load group sessions',
          })
          throw error
        }
      },

      refreshSession: async (sessionId) => {
        const token = stateRef.current.accessToken
        if (!token || stateRef.current.demoMode) return

        dispatch({ type: 'SESSIONS_LOADING', loading: true })
        try {
          const { studySession } = await api.getSession(token, sessionId)
          dispatch({ type: 'UPSERT_SESSION', session: sessionFromApi(studySession) })
        } catch (error) {
          dispatch({
            type: 'SESSIONS_FAILURE',
            message: error instanceof Error ? error.message : 'Could not load session',
          })
          throw error
        }
      },

      refreshCurrentUser: async () => {
        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        const { user } = await api.me(token)
        dispatch({ type: 'AUTH_SUCCESS', user, accessToken: token })
        return user
      },

      loadDepartments: async () => {
        if (stateRef.current.departments.length > 0) return
        try {
          const { departments } = await api.listDepartments()
          dispatch({ type: 'DEPARTMENTS_SUCCESS', departments })
        } catch {
          /* The add-course form falls back to a blocked state on its own. */
        }
      },

      createCourse: async (input) => {
        if (stateRef.current.demoMode) {
          const course: ApiCourse = {
            id: nextId('c'),
            code: input.code,
            title: input.title,
            description: input.description ?? null,
            department:
              stateRef.current.departments.find((d) => d.id === input.departmentId) ?? null,
          }
          dispatch({ type: 'COURSES_UPSERT', courses: [course] })
          toast.success(`${course.code} added`)
          return course
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { course } = await api.createCourse(token, input)
          dispatch({ type: 'COURSES_UPSERT', courses: [course] })
          toast.success(`${course.code} added`)
          return course
        } catch (error) {
          /* 409 means someone already created it. Adopting the existing course is
             the whole anti-duplication guard — surfacing an error here is what
             would push students into inventing a variant code. */
          if (error instanceof ApiError && error.status === 409) {
            const existing = (error.data as { course?: ApiCourse } | undefined)?.course
            if (existing) {
              dispatch({ type: 'COURSES_UPSERT', courses: [existing] })
              return existing
            }
          }
          toast.error(error instanceof Error ? error.message : 'Could not add course')
          throw error
        }
      },

      addCourse: async (courseId) => {
        if (stateRef.current.demoMode) {
          const course = stateRef.current.courses.find((item) => item.id === courseId)
          if (course) {
            const next = [...stateRef.current.profile.courseDetails]
            if (!next.some((item) => item.id === course.id)) next.push(course)
            dispatch({ type: 'PROFILE_COURSES_SUCCESS', courses: next })
            toast.success(`${course.code} added`)
          }
          return
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { user } = await api.addMyCourse(token, courseId)
          dispatch({ type: 'AUTH_SUCCESS', user, accessToken: token })
          toast.success('Course added')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not add course')
          throw error
        }
      },

      removeCourse: async (courseId) => {
        if (stateRef.current.demoMode) {
          const next = stateRef.current.profile.courseDetails.filter((course) => course.id !== courseId)
          dispatch({ type: 'PROFILE_COURSES_SUCCESS', courses: next })
          toast('Course removed')
          return
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { user } = await api.removeMyCourse(token, courseId)
          dispatch({ type: 'AUTH_SUCCESS', user, accessToken: token })
          toast('Course removed')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not remove course')
          throw error
        }
      },

      joinGroup: async (groupId) => {
        const group = stateRef.current.groups.find((g) => g.id === groupId)
        if (stateRef.current.demoMode) {
          if (group) {
            const memberIds = group.memberIds ?? group.members?.map((member) => member.id) ?? []
            if (!memberIds.includes(VIEWER_ID)) {
              dispatch({
                type: 'UPSERT_GROUP',
                group: groupFromDemo({ ...group, memberIds: [...memberIds, VIEWER_ID] }),
              })
            }
          }
          toast.success(group ? `Joined ${group.name}` : 'Joined group')
          return
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { studyGroup } = await api.joinStudyGroup(token, groupId)
          dispatch({ type: 'UPSERT_GROUP', group: groupFromApi(studyGroup) })
          const { user } = await api.me(token)
          dispatch({ type: 'AUTH_SUCCESS', user, accessToken: token })
          toast.success(`Joined ${studyGroup.name}`)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not join group')
          throw error
        }
      },

      leaveGroup: async (groupId) => {
        const group = stateRef.current.groups.find((g) => g.id === groupId)
        if (stateRef.current.demoMode) {
          if (group) {
            const memberIds = group.memberIds ?? group.members?.map((member) => member.id) ?? []
            dispatch({
              type: 'UPSERT_GROUP',
              group: groupFromDemo({
                ...group,
                memberIds: memberIds.filter((id) => id !== VIEWER_ID),
              }),
            })
          }
          toast(group ? `Left ${group.name}` : 'Left group')
          return
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { studyGroup } = await api.leaveStudyGroup(token, groupId)
          dispatch({ type: 'UPSERT_GROUP', group: groupFromApi(studyGroup) })
          toast(`Left ${studyGroup.name}`)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not leave group')
          throw error
        }
      },

      deleteGroup: async (groupId) => {
        const group = stateRef.current.groups.find((g) => g.id === groupId)
        if (stateRef.current.demoMode) {
          dispatch({ type: 'REMOVE_GROUP', groupId })
          toast(group ? `${group.name} deleted` : 'Group deleted')
          return
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          await api.deleteStudyGroup(token, groupId)
          dispatch({ type: 'REMOVE_GROUP', groupId })
          toast(group ? `${group.name} deleted` : 'Group deleted')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not delete group')
          throw error
        }
      },

      setRsvp: async (sessionId, status) => {
        if (stateRef.current.demoMode) {
          dispatch({ type: 'SET_RSVP', sessionId, status })
          toast.success(
            status === 'going'
              ? "You're going"
              : status === 'maybe'
                ? 'Marked as maybe'
                : 'Marked as not going',
          )
          return
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { studySession } = await api.setSessionRsvp(token, sessionId, status)
          dispatch({ type: 'UPSERT_SESSION', session: sessionFromApi(studySession) })
          toast.success(
            status === 'going'
              ? "You're going"
              : status === 'maybe'
                ? 'Marked as maybe'
                : 'Marked as not going',
          )
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not update RSVP')
          throw error
        }
      },

      /* Demo only. There is no messages endpoint, so a real account must never
         see a fabricated conversation — the composer is disabled for them and
         this is a no-op if it is ever called anyway. */
      sendMessage: (groupId, body) => {
        if (!stateRef.current.demoMode) return

        dispatch({
          type: 'SEND_MESSAGE',
          message: {
            id: nextId('m'),
            groupId,
            authorId: VIEWER_ID,
            body,
            sentAt: new Date().toISOString(),
          },
        })

        const group = stateRef.current.groups.find((g) => g.id === groupId)
        if (!group) return
        const memberIds = group.members?.map((member) => member.id) ?? group.memberIds ?? []
        const others = memberIds.filter((id) => id !== VIEWER_ID)
        const reply = nextReply(groupId, others, stateRef.current.replyTurn[groupId] ?? 0)
        if (!reply) return

        later(() => dispatch({ type: 'SET_TYPING', groupId }), 900)
        later(
          () =>
            dispatch({
              type: 'RECEIVE_MESSAGE',
              message: {
                id: nextId('m'),
                groupId,
                authorId: reply.authorId,
                body: reply.body,
                sentAt: new Date().toISOString(),
              },
            }),
          2600,
        )
      },

      createGroup: async (input) => {
        if (stateRef.current.demoMode) {
          const id = nextId('g')
          const course = stateRef.current.courses.find((item) => item.id === input.courseId)
          dispatch({
            type: 'UPSERT_GROUP',
            group: groupFromDemo({
              id,
              name: input.name,
              courseId: input.courseId,
              courseCode: course?.code ?? 'CS 2308',
              description: input.description,
              purpose: input.purpose,
              meetingStyle: input.meetingStyle,
              maxMembers: input.maxMembers,
              memberIds: [VIEWER_ID],
              creatorId: VIEWER_ID,
              createdAt: new Date().toISOString(),
            }),
          })
          toast.success(`${input.name} created`)
          return id
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { studyGroup } = await api.createStudyGroup(token, input)
          dispatch({ type: 'UPSERT_GROUP', group: groupFromApi(studyGroup) })
          const { user } = await api.me(token)
          dispatch({ type: 'AUTH_SUCCESS', user, accessToken: token })
          toast.success(`${studyGroup.name} created`)
          return studyGroup.id
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not create group')
          throw error
        }
      },

      createSession: async (input) => {
        const endsAt = plusMinutes(input.startsAt, input.durationMinutes)

        if (stateRef.current.demoMode) {
          const id = nextId('s')
          dispatch({
            type: 'CREATE_SESSION',
            session: sessionFromDemo({
              id,
              groupId: input.groupId,
              title: input.title,
              description: input.description,
              startsAt: input.startsAt,
              endsAt,
              mode: input.mode,
              location: input.location,
              locationDetail: input.locationDetail,
              meetingLink: input.meetingLink,
              organizerId: VIEWER_ID,
              rsvps: { [VIEWER_ID]: 'going' },
              createdAt: new Date().toISOString(),
            }),
          })
          toast.success('Session scheduled')
          return id
        }

        const token = stateRef.current.accessToken
        if (!token) throw new Error('Authentication required')

        try {
          const { studySession } = await api.createStudySession(token, input.groupId, {
            title: input.title,
            description: input.description,
            startsAt: input.startsAt,
            endsAt,
            mode: input.mode,
            location: input.location,
            locationDetail: input.locationDetail,
            meetingLink: input.meetingLink,
          })
          dispatch({ type: 'UPSERT_SESSION', session: sessionFromApi(studySession) })
          toast.success('Session scheduled')
          return studySession.id
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not schedule session')
          throw error
        }
      },

      markGroupRead: (groupId) => dispatch({ type: 'MARK_GROUP_READ', groupId }),
      markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
    }
  }, [state])

  return <AppContext.Provider value={appApi}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = React.useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
