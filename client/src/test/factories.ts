import type {
  ApiCircle,
  ApiCourse,
  ApiQuestion,
  ApiSession,
  ApiStudyRequest,
  ApiTimeOption,
} from '@/lib/api'

/**
 * Minimal builders for the API shapes the pure helpers operate on.
 *
 * Every field the server sends is present so a test can never pass because a
 * helper silently read `undefined` where production reads a value.
 */

const iso = (offsetHours: number) =>
  new Date(Date.now() + offsetHours * 3600_000).toISOString()

export const course = (overrides: Partial<ApiCourse> = {}): ApiCourse => ({
  id: 'course-1',
  code: 'CS 3358',
  title: 'Data Structures and Algorithms',
  description: null,
  department: { id: 'dep-1', code: 'CS', name: 'Computer Science' },
  ...overrides,
})

export const timeOption = (overrides: Partial<ApiTimeOption> = {}): ApiTimeOption => ({
  id: 'time-1',
  startsAt: iso(24),
  endsAt: iso(26),
  availableCount: 1,
  selectedByMe: false,
  ...overrides,
})

export const studyRequest = (overrides: Partial<ApiStudyRequest> = {}): ApiStudyRequest => {
  const base: ApiStudyRequest = {
    id: 'request-1',
    courseId: 'course-1',
    course: course(),
    creatorId: 'user-creator',
    creator: { id: 'user-creator', name: 'Maya Torres', major: 'CS', gradYear: 2027 },
    topic: 'Linked lists and pointer diagrams',
    details: null,
    intent: 'NEED_HELP',
    meetingStyle: 'IN_PERSON',
    location: 'Alkek 4th floor',
    maxParticipants: 4,
    status: 'OPEN',
    expiresAt: null,
    createdAt: iso(-2),
    updatedAt: iso(-2),
    timeOptions: [timeOption()],
    participants: [],
    participantCount: 1,
    spotsLeft: 3,
    isFull: false,
    isCreator: false,
    hasJoined: false,
    sessionId: null,
    isOpen: true,
  }

  return { ...base, ...overrides }
}

export const session = (overrides: Partial<ApiSession> = {}): ApiSession => ({
  id: 'session-1',
  courseId: 'course-1',
  course: { id: 'course-1', code: 'CS 3358', title: 'Data Structures and Algorithms' },
  circleId: null,
  circle: null,
  studyRequestId: null,
  studyRequest: null,
  organizerId: 'user-creator',
  organizer: { id: 'user-creator', name: 'Maya Torres', major: 'CS', gradYear: 2027 },
  title: 'Problem set 4',
  description: 'Trees and traversals',
  agenda: null,
  startsAt: iso(24),
  endsAt: iso(26),
  mode: 'IN_PERSON',
  location: 'Alkek Library',
  locationDetail: '4th floor',
  meetingLink: null,
  attendees: [],
  status: 'PLANNED',
  topicsCompleted: null,
  recap: null,
  myRsvp: null,
  goingCount: 0,
  maybeCount: 0,
  cantCount: 0,
  isOrganizer: false,
  canAccessDetails: true,
  createdAt: iso(-4),
  updatedAt: iso(-4),
  ...overrides,
})

export const circle = (overrides: Partial<ApiCircle> = {}): ApiCircle => ({
  id: 'circle-1',
  name: 'CS 3358 Tuesday Crew',
  description: 'Weekly problem set group',
  purpose: 'WEEKLY_STUDYING',
  meetingStyle: 'IN_PERSON',
  maxMembers: 6,
  recurringSchedule: 'Tuesdays 6 PM',
  externalLink: null,
  term: 'Fall 2026',
  status: 'ACTIVE',
  courseId: 'course-1',
  course: course(),
  creatorId: 'user-creator',
  creator: { id: 'user-creator', name: 'Maya Torres', major: 'CS', gradYear: 2027 },
  members: [],
  memberCount: 1,
  spotsLeft: 5,
  isFull: false,
  isMember: false,
  isOwner: false,
  createdAt: iso(-100),
  updatedAt: iso(-100),
  ...overrides,
})

export const question = (overrides: Partial<ApiQuestion> = {}): ApiQuestion => ({
  id: 'question-1',
  courseId: 'course-1',
  course: { id: 'course-1', code: 'CS 3358', title: 'Data Structures and Algorithms' },
  authorId: 'user-me',
  author: { id: 'user-me', name: 'Demo Student', major: 'CS', gradYear: 2028 },
  title: 'Why the in-order successor?',
  body: 'Both seem symmetric to me.',
  status: 'OPEN',
  acceptedAnswerId: null,
  answerCount: 0,
  answers: [],
  isAuthor: true,
  createdAt: iso(-6),
  updatedAt: iso(-6),
  ...overrides,
})
