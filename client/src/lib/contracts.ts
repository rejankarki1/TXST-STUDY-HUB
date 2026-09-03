/**
 * The wire contract, mirrored from the server's Zod enums.
 *
 * These are the exact strings the API sends and accepts — no translation layer
 * in between. The label maps below are the only place a stored value becomes
 * display text, so renaming a label never risks changing what goes over the
 * wire.
 */

export const STUDY_REQUEST_INTENTS = ['NEED_HELP', 'CAN_HELP', 'REVIEW_TOGETHER'] as const
export type StudyRequestIntent = (typeof STUDY_REQUEST_INTENTS)[number]

export const MEETING_STYLES = ['IN_PERSON', 'ONLINE', 'FLEXIBLE'] as const
export type MeetingStyle = (typeof MEETING_STYLES)[number]

export const SESSION_MODES = ['IN_PERSON', 'ONLINE'] as const
export type SessionMode = (typeof SESSION_MODES)[number]

export const SESSION_STATUSES = ['PLANNED', 'COMPLETED', 'CANCELLED'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const RSVP_STATUSES = ['GOING', 'MAYBE', 'CANT'] as const
export type RsvpStatus = (typeof RSVP_STATUSES)[number]

export const STUDY_REQUEST_STATUSES = [
  'OPEN',
  'MATCHED',
  'CONVERTED',
  'CANCELLED',
  'EXPIRED',
] as const
export type StudyRequestStatus = (typeof STUDY_REQUEST_STATUSES)[number]

export const CIRCLE_PURPOSES = [
  'EXAM_PREP',
  'HOMEWORK',
  'WEEKLY_STUDYING',
  'PROJECT_WORK',
  'GENERAL_STUDY',
] as const
export type CirclePurpose = (typeof CIRCLE_PURPOSES)[number]

export const CIRCLE_STATUSES = ['ACTIVE', 'ARCHIVED'] as const
export type CircleStatus = (typeof CIRCLE_STATUSES)[number]

export const QUESTION_STATUSES = ['OPEN', 'SOLVED'] as const
export type QuestionStatus = (typeof QUESTION_STATUSES)[number]

/* ------------------------------------------------------------------ labels */

export const INTENT_LABELS: Record<StudyRequestIntent, string> = {
  NEED_HELP: 'Needs help',
  CAN_HELP: 'Can help',
  REVIEW_TOGETHER: 'Review together',
}

/** First person, for the compose form where the student is describing themselves. */
export const INTENT_CHOICE_LABELS: Record<StudyRequestIntent, string> = {
  NEED_HELP: 'I need help',
  CAN_HELP: 'I can help',
  REVIEW_TOGETHER: 'Review together',
}

export const INTENT_HINTS: Record<StudyRequestIntent, string> = {
  NEED_HELP: 'You are stuck and want someone to work through it with you.',
  CAN_HELP: 'You understand this and are offering to explain it.',
  REVIEW_TOGETHER: 'Nobody is teaching — you all work through it as equals.',
}

export const MEETING_STYLE_LABELS: Record<MeetingStyle, string> = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
  FLEXIBLE: 'Either works',
}

export const SESSION_MODE_LABELS: Record<SessionMode, string> = {
  IN_PERSON: 'In person',
  ONLINE: 'Online',
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  PLANNED: 'Planned',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  GOING: 'Going',
  MAYBE: 'Maybe',
  CANT: "Can't",
}

export const STUDY_REQUEST_STATUS_LABELS: Record<StudyRequestStatus, string> = {
  OPEN: 'Open',
  MATCHED: 'Matched',
  CONVERTED: 'Scheduled',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export const CIRCLE_PURPOSE_LABELS: Record<CirclePurpose, string> = {
  EXAM_PREP: 'Exam prep',
  HOMEWORK: 'Homework',
  WEEKLY_STUDYING: 'Weekly studying',
  PROJECT_WORK: 'Project work',
  GENERAL_STUDY: 'General study',
}

export const CIRCLE_STATUS_LABELS: Record<CircleStatus, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  OPEN: 'Open',
  SOLVED: 'Solved',
}

/** Intent drives the one piece of colour a request card carries. */
export const INTENT_TONES: Record<StudyRequestIntent, 'primary' | 'success' | 'neutral'> = {
  NEED_HELP: 'primary',
  CAN_HELP: 'success',
  REVIEW_TOGETHER: 'neutral',
}
