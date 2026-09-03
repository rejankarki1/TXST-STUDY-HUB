import type {
  CirclePurpose,
  CircleStatus,
  MeetingStyle,
  QuestionStatus,
  RsvpStatus,
  SessionMode,
  SessionStatus,
  StudyRequestIntent,
  StudyRequestStatus,
} from '@/lib/contracts'

export type ApiDepartment = {
  id: string
  code: string
  name: string
}

export type ApiCourse = {
  id: string
  code: string
  title: string
  description?: string | null
  department?: ApiDepartment | null
}

/** The only shape of another student the API returns. Never carries an email. */
export type ApiPerson = {
  id: string
  name: string
  major?: string | null
  gradYear?: number | null
}

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN'
  major: string | null
  gradYear: number | null
  onboardingCompleted: boolean
  studyProfileVisible: boolean
  courses: ApiCourse[]
}

export type AuthPayload = {
  user: CurrentUser
  accessToken: string
}

export type ApiCoursePerson = ApiPerson & {
  joinedCourseAt: string
  isMe: boolean
  currentIntent: { requestId: string; topic: string; intent: StudyRequestIntent } | null
}

export type ApiTimeOption = {
  id: string
  startsAt: string
  endsAt: string
  availableCount: number
  selectedByMe: boolean
}

export type ApiRequestParticipant = ApiPerson & {
  joinedAt: string
  isCreator: boolean
  timeOptionIds: string[]
}

export type ApiStudyRequest = {
  id: string
  courseId: string
  course: ApiCourse
  creatorId: string
  creator: ApiPerson
  topic: string
  details: string | null
  intent: StudyRequestIntent
  meetingStyle: MeetingStyle
  location: string | null
  maxParticipants: number
  status: StudyRequestStatus
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  timeOptions: ApiTimeOption[]
  participants: ApiRequestParticipant[]
  participantCount: number
  spotsLeft: number
  isFull: boolean
  isCreator: boolean
  hasJoined: boolean
  sessionId: string | null
  isOpen: boolean
}

export type ApiSessionAttendee = ApiPerson & {
  status: RsvpStatus
  rsvpUpdatedAt: string
}

export type ApiSession = {
  id: string
  courseId: string
  course: { id: string; code: string; title: string }
  circleId: string | null
  circle: { id: string; name: string } | null
  studyRequestId: string | null
  studyRequest: { id: string; topic: string; intent: StudyRequestIntent } | null
  organizerId: string
  organizer: ApiPerson
  title: string
  description: string
  agenda: string | null
  startsAt: string
  endsAt: string
  mode: SessionMode
  location: string
  locationDetail: string | null
  /** null when the viewer is not a participant — see canAccessDetails. */
  meetingLink: string | null
  attendees: ApiSessionAttendee[]
  status: SessionStatus
  topicsCompleted: string | null
  recap: string | null
  myRsvp: RsvpStatus | null
  goingCount: number
  maybeCount: number
  cantCount: number
  isOrganizer: boolean
  canAccessDetails: boolean
  createdAt: string
  updatedAt: string
}

export type ApiCircleMember = ApiPerson & {
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

export type ApiCircle = {
  id: string
  name: string
  description: string
  purpose: CirclePurpose
  meetingStyle: MeetingStyle
  maxMembers: number
  recurringSchedule: string | null
  externalLink: string | null
  term: string
  status: CircleStatus
  courseId: string
  course: ApiCourse
  creatorId: string
  creator: ApiPerson
  members: ApiCircleMember[]
  memberCount: number
  spotsLeft: number
  isFull: boolean
  isMember: boolean
  isOwner: boolean
  createdAt: string
  updatedAt: string
}

export type ApiAnswer = {
  id: string
  questionId: string
  body: string
  authorId: string
  author: ApiPerson
  isAccepted: boolean
  isMine: boolean
  createdAt: string
  updatedAt: string
}

export type ApiQuestion = {
  id: string
  courseId: string
  course: { id: string; code: string; title: string }
  authorId: string
  author: ApiPerson
  title: string
  body: string
  status: QuestionStatus
  acceptedAnswerId: string | null
  answerCount: number
  answers: ApiAnswer[]
  isAuthor: boolean
  createdAt: string
  updatedAt: string
}
