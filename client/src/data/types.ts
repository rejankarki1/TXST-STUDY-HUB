export type Year = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior'

export type Person = {
  id: string
  name: string
  major: string
  year: Year
  gradYear: number
}

export type Course = {
  code: string
  title: string
  department: string
}

export type MeetingStyle = 'in-person' | 'online' | 'flexible'

export type GroupPurpose =
  | 'Exam prep'
  | 'Homework'
  | 'Weekly studying'
  | 'Project work'
  | 'General study'

export type Group = {
  id: string
  name: string
  courseCode: string
  description: string
  purpose: GroupPurpose
  meetingStyle: MeetingStyle
  maxMembers: number
  memberIds: string[]
  creatorId: string
  createdAt: string
}

export type RsvpStatus = 'going' | 'maybe' | 'cant'

export type Session = {
  id: string
  groupId: string
  title: string
  description: string
  startsAt: string
  endsAt: string
  mode: 'in-person' | 'online'
  location: string
  /** "4th Floor", "Room 244" — the detail that actually gets you to the table. */
  locationDetail?: string
  meetingLink?: string
  organizerId: string
  rsvps: Record<string, RsvpStatus>
  /** When the session was put on the calendar — drives the activity feed. */
  createdAt?: string
}

export type Message = {
  id: string
  groupId: string
  authorId: string
  body: string
  sentAt: string
}

export type NotificationKind = 'session' | 'message' | 'reminder' | 'member'

export type Notification = {
  id: string
  kind: NotificationKind
  /** Rendered as: <strong>{actor}</strong> {text} — keeps copy human. */
  actor?: string
  text: string
  groupId?: string
  sessionId?: string
  at: string
  read: boolean
}
