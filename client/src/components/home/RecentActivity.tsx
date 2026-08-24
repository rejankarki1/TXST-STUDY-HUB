import { Link } from 'react-router-dom'
import { Card, SectionHeader } from '@/components/primitives'
import { relative } from '@/lib/format'
import { NOTIFICATION_ICONS, notificationHref } from '@/lib/notifications'
import { useApp } from '@/state/AppState'

const PREVIEW = 4

/**
 * What changed across your groups since you last looked. Every item is a link to
 * the place it happened; there is no "View all" because there is no activity
 * page to send anyone to.
 *
 * Renders nothing when there is nothing — Home already carries enough empty
 * cards, and an account with no notifications is the normal case until the feed
 * has a backend.
 */
export function RecentActivity() {
  const { state } = useApp()
  const items = [...state.notifications]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, PREVIEW)

  if (!items.length) return null

  return (
    <Card>
      <SectionHeader title="Recent activity" />

      <ul className="-mx-2 space-y-0.5">
        {items.map((n) => {
          const Icon = NOTIFICATION_ICONS[n.kind]
          return (
            <li key={n.id}>
              <Link
                to={notificationHref(n)}
                className="flex gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground">
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
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
