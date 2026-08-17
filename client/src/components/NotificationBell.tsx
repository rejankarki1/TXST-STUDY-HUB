import * as React from 'react'
import { Link } from 'react-router-dom'
import { Bell, CalendarPlus, MessageSquare, UserPlus, Clock } from 'lucide-react'
import type { Notification } from '@/data/types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { useUnreadNotifications } from '@/state/selectors'

const ICONS = {
  session: CalendarPlus,
  message: MessageSquare,
  reminder: Clock,
  member: UserPlus,
} as const

function destination(n: Notification) {
  if (n.sessionId) return `/sessions/${n.sessionId}`
  if (n.kind === 'message' && n.groupId) return `/groups/${n.groupId}/chat`
  if (n.groupId) return `/groups/${n.groupId}`
  return '/home'
}

export function NotificationBell({ className }: { className?: string }) {
  const { state, markNotificationsRead } = useApp()
  const unread = useUnreadNotifications()
  const [open, setOpen] = React.useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        /* Reading the panel is what clears the badge. */
        if (!next && unread) markNotificationsRead()
      }}
    >
      <PopoverTrigger
        className={cn(
          'relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground',
          'data-[state=open]:bg-surface-sunken data-[state=open]:text-foreground',
          className,
        )}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-surface" />
        )}
      </PopoverTrigger>

      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markNotificationsRead}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Mark all read
            </button>
          )}
        </div>

        <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto scroll-slim">
          {state.notifications.map((n) => {
            const Icon = ICONS[n.kind]
            return (
              <li key={n.id}>
                <Link
                  to={destination(n)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex gap-3 px-4 py-3 transition-colors hover:bg-surface-sunken',
                    !n.read && 'bg-primary-subtle/40',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                      n.read ? 'bg-surface-sunken text-muted-foreground' : 'bg-primary-subtle text-primary',
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-relaxed text-foreground-soft">
                      {n.actor && <strong className="font-semibold text-foreground">{n.actor} </strong>}
                      {n.text}
                    </span>
                    <span className="mt-0.5 block text-xs text-faint-foreground">
                      {relative(n.at)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
