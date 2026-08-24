import type { ComponentType } from 'react'
import { CalendarPlus, Clock, MessageSquare, UserPlus } from 'lucide-react'
import type { Notification, NotificationKind } from '@/data/types'

/** The one place a notification kind becomes an icon. */
export const NOTIFICATION_ICONS: Record<NotificationKind, ComponentType<{ className?: string }>> = {
  session: CalendarPlus,
  message: MessageSquare,
  reminder: Clock,
  member: UserPlus,
}

/**
 * Where a notification takes you. Shared by the bell and Home's activity feed so
 * the same item never routes two different ways. Every branch is a real route —
 * see App.tsx.
 */
export function notificationHref(n: Notification) {
  if (n.sessionId) return `/sessions/${n.sessionId}`
  if (n.groupId) {
    if (n.kind === 'message') return `/groups/${n.groupId}/chat`
    if (n.kind === 'member') return `/groups/${n.groupId}/members`
    return `/groups/${n.groupId}`
  }
  return '/home'
}
