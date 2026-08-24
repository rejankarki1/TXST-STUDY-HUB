import * as React from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { relative } from '@/lib/format'
import { NOTIFICATION_ICONS, notificationHref } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { useUnreadNotifications } from '@/state/selectors'

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
          'relative inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground',
          'data-[state=open]:bg-surface-hover data-[state=open]:text-foreground',
          className,
        )}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-surface" />
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
            const Icon = NOTIFICATION_ICONS[n.kind]
            return (
              <li key={n.id}>
                <Link
                  to={notificationHref(n)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex gap-3 px-4 py-3 transition-colors hover:bg-surface-hover',
                    !n.read && 'bg-primary-subtle/40',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
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
