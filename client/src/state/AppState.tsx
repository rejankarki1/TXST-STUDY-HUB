import * as React from 'react'
import { toast } from 'sonner'
import type {
  Group,
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

/* ------------------------------------------------------------------ types */

export type Profile = {
  name: string
  email: string
  major: string
  gradYear: number
  courses: string[]
}

export type AppState = {
  signedIn: boolean
  onboarded: boolean
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
  | { type: 'SIGN_IN'; email?: string; name?: string }
  | { type: 'SIGN_OUT' }
  | { type: 'ENTER_DEMO' }
  | { type: 'COMPLETE_ONBOARDING'; major: string; gradYear: number; courses: string[] }
  | { type: 'JOIN_GROUP'; groupId: string }
  | { type: 'LEAVE_GROUP'; groupId: string }
  | { type: 'SET_RSVP'; sessionId: string; status: RsvpStatus }
  | { type: 'SEND_MESSAGE'; message: Message }
  | { type: 'RECEIVE_MESSAGE'; message: Message }
  | { type: 'SET_TYPING'; groupId: string | null }
  | { type: 'CREATE_GROUP'; group: Group }
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
}

const initialState: AppState = {
  signedIn: false,
  onboarded: false,
  profile: DEMO_PROFILE,
  groups: seedGroups,
  sessions: seedSessions,
  messages: seedMessages,
  notifications: seedNotifications,
  unread: initialUnread,
  typingIn: null,
  replyTurn: {},
}

/* --------------------------------------------------------------- reducer */

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SIGN_IN':
      return {
        ...state,
        signedIn: true,
        profile: {
          ...state.profile,
          name: action.name?.trim() || state.profile.name,
          email: action.email?.trim() || state.profile.email,
        },
      }

    case 'SIGN_OUT':
      return { ...initialState }

    /* "Skip to demo" — a fully populated account, no onboarding. */
    case 'ENTER_DEMO':
      return { ...state, signedIn: true, onboarded: true, profile: DEMO_PROFILE }

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        onboarded: true,
        profile: {
          ...state.profile,
          major: action.major,
          gradYear: action.gradYear,
          courses: action.courses,
        },
      }

    case 'JOIN_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId && !g.memberIds.includes(VIEWER_ID)
            ? { ...g, memberIds: [...g.memberIds, VIEWER_ID] }
            : g,
        ),
      }

    case 'LEAVE_GROUP':
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.groupId
            ? { ...g, memberIds: g.memberIds.filter((id) => id !== VIEWER_ID) }
            : g,
        ),
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

    case 'CREATE_GROUP':
      return { ...state, groups: [action.group, ...state.groups] }

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

export type NewGroupInput = {
  name: string
  courseCode: string
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
  signIn: (input?: { email?: string; name?: string }) => void
  signOut: () => void
  enterDemo: () => void
  completeOnboarding: (input: { major: string; gradYear: number; courses: string[] }) => void
  joinGroup: (groupId: string) => void
  leaveGroup: (groupId: string) => void
  setRsvp: (sessionId: string, status: RsvpStatus) => void
  sendMessage: (groupId: string, body: string) => void
  createGroup: (input: NewGroupInput) => string
  createSession: (input: NewSessionInput) => string
  markGroupRead: (groupId: string) => void
  markNotificationsRead: () => void
}

const AppContext = React.createContext<AppApi | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const stateRef = React.useRef(state)
  stateRef.current = state

  /* Timers for the scripted chat reply; cleared if the provider unmounts. */
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([])
  React.useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const api = React.useMemo<AppApi>(() => {
    const later = (fn: () => void, ms: number) => {
      timers.current.push(setTimeout(fn, ms))
    }

    return {
      state,

      signIn: (input) => dispatch({ type: 'SIGN_IN', ...input }),
      signOut: () => dispatch({ type: 'SIGN_OUT' }),
      enterDemo: () => dispatch({ type: 'ENTER_DEMO' }),
      completeOnboarding: (input) => dispatch({ type: 'COMPLETE_ONBOARDING', ...input }),

      joinGroup: (groupId) => {
        const group = stateRef.current.groups.find((g) => g.id === groupId)
        dispatch({ type: 'JOIN_GROUP', groupId })
        if (group) toast.success(`Joined ${group.name}`)
      },

      leaveGroup: (groupId) => {
        const group = stateRef.current.groups.find((g) => g.id === groupId)
        dispatch({ type: 'LEAVE_GROUP', groupId })
        if (group) toast(`Left ${group.name}`)
      },

      setRsvp: (sessionId, status) => {
        dispatch({ type: 'SET_RSVP', sessionId, status })
        toast.success(
          status === 'going'
            ? "You're going"
            : status === 'maybe'
              ? 'Marked as maybe'
              : 'Marked as not going',
        )
      },

      /* Optimistic send, then a scripted member reply so the chat screen
         demonstrates a real conversation. */
      sendMessage: (groupId, body) => {
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
        const others = group.memberIds.filter((id) => id !== VIEWER_ID)
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

      createGroup: (input) => {
        const id = nextId('g')
        dispatch({
          type: 'CREATE_GROUP',
          group: {
            id,
            ...input,
            memberIds: [VIEWER_ID],
            creatorId: VIEWER_ID,
            createdAt: new Date().toISOString(),
          },
        })
        toast.success(`${input.name} created`)
        return id
      },

      createSession: (input) => {
        const id = nextId('s')
        dispatch({
          type: 'CREATE_SESSION',
          session: {
            id,
            groupId: input.groupId,
            title: input.title,
            description: input.description,
            startsAt: input.startsAt,
            endsAt: plusMinutes(input.startsAt, input.durationMinutes),
            mode: input.mode,
            location: input.location,
            locationDetail: input.locationDetail,
            meetingLink: input.meetingLink,
            organizerId: VIEWER_ID,
            rsvps: { [VIEWER_ID]: 'going' },
          },
        })
        toast.success('Session scheduled')
        return id
      },

      markGroupRead: (groupId) => dispatch({ type: 'MARK_GROUP_READ', groupId }),
      markNotificationsRead: () => dispatch({ type: 'MARK_NOTIFICATIONS_READ' }),
    }
  }, [state])

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = React.useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
