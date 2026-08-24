import {
  format,
  formatDistanceToNowStrict,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from 'date-fns'
import type { MeetingStyle } from '@/data/types'

export const toDate = (iso: string) => parseISO(iso)

/** "6:00 PM" */
export const time = (iso: string) => format(parseISO(iso), 'h:mm a')

/** "6:00 PM – 8:00 PM" */
export const timeRange = (startIso: string, endIso: string) =>
  `${time(startIso)} – ${time(endIso)}`

/** "Today", "Tomorrow", "Tuesday", or "Sep 24" for anything further out. */
export function dayLabel(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  const days = Math.abs(Date.now() - d.getTime()) / 86_400_000
  if (days < 7) return format(d, 'EEEE')
  return format(d, 'MMM d')
}

/** "Tuesday, September 8" — the long form used on session detail pages. */
export const fullDate = (iso: string) => format(parseISO(iso), 'EEEE, MMMM d')

/** "Tonight · 6 PM", "Tue · 6 PM" — the compact form used on cards and rows. */
export function shortWhen(iso: string) {
  const d = parseISO(iso)
  const hour = format(d, 'h')
  const meridiem = format(d, 'a')
  const minute = d.getMinutes()
  const clock = minute === 0 ? `${hour} ${meridiem}` : `${hour}:${format(d, 'mm')} ${meridiem}`
  if (isToday(d)) return `${d.getHours() >= 17 ? 'Tonight' : 'Today'} · ${clock}`
  if (isTomorrow(d)) return `Tomorrow · ${clock}`
  const days = Math.abs(Date.now() - d.getTime()) / 86_400_000
  if (days < 7) return `${format(d, 'EEE')} · ${clock}`
  return `${format(d, 'MMM d')} · ${clock}`
}

/** "5 min ago" for the activity feed and notifications. */
export function relative(iso: string) {
  const diff = Date.now() - parseISO(iso).getTime()
  if (diff < 60_000) return 'Just now'
  return `${formatDistanceToNowStrict(parseISO(iso), { addSuffix: false })} ago`
}

/** Date separators inside the chat transcript. */
export function chatDayLabel(iso: string) {
  const d = parseISO(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  const days = Math.abs(Date.now() - d.getTime()) / 86_400_000
  if (days < 7) return format(d, 'EEEE')
  return format(d, 'MMMM d, yyyy')
}

export const sameDay = (a: string, b: string) => isSameDay(parseISO(a), parseISO(b))

export const isPast = (iso: string) => parseISO(iso).getTime() < Date.now()

/** The one place a stored meeting style becomes display text. */
const MEETING_STYLE: Record<MeetingStyle, string> = {
  'in-person': 'In person',
  online: 'Online',
  flexible: 'Flexible',
}

export const meetingStyleLabel = (style: MeetingStyle) => MEETING_STYLE[style]
