import { Link } from 'react-router-dom'
import { Clock, MapPin, Video } from 'lucide-react'
import type { Session } from '@/data/types'
import { Button } from '@/components/ui/button'
import { AvatarStack } from '@/components/Avatar'
import { dayLabel, timeRange } from '@/lib/format'
import { goingCount, rsvpPeople } from '@/state/selectors'
import { useApp } from '@/state/AppState'
import { cn } from '@/lib/utils'

/**
 * The most important block in the product: the one thing the student needs to
 * know when they open the app. Given a distinct maroon-tinted ground so it
 * reads as different in kind from everything else on the page — but kept to a
 * compact height so it never dominates.
 */
export function NextSessionCard({
  session,
  eyebrow = 'Next up',
  className,
  showGroupLink = true,
}: {
  session: Session
  eyebrow?: string
  className?: string
  showGroupLink?: boolean
}) {
  const { state } = useApp()
  const group = state.groups.find((g) => g.id === session.groupId)
  const going = rsvpPeople(session, 'going')
  const online = session.mode === 'online'

  return (
    <section
      className={cn(
        'rounded-lg border border-primary-border bg-primary-subtle p-5 sm:p-6',
        className,
      )}
      aria-label={`${eyebrow}: ${session.title}`}
    >
      <p className="text-eyebrow text-primary">
        {eyebrow}
        {group && <span className="text-primary/60"> · {group.courseCode}</span>}
      </p>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
        {session.title}
      </h2>

      <dl className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:gap-8">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden="true" />
          <div className="text-sm leading-snug">
            <dt className="sr-only">When</dt>
            <dd className="font-medium text-foreground">{dayLabel(session.startsAt)}</dd>
            <dd className="text-muted-foreground">
              {timeRange(session.startsAt, session.endsAt)}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          {online ? (
            <Video className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden="true" />
          ) : (
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden="true" />
          )}
          <div className="text-sm leading-snug">
            <dt className="sr-only">Where</dt>
            <dd className="font-medium text-foreground">{session.location}</dd>
            {session.locationDetail && (
              <dd className="text-muted-foreground">{session.locationDetail}</dd>
            )}
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-primary-border/70 pt-4">
        <div className="flex items-center gap-2.5">
          <AvatarStack people={going} max={5} size="sm" />
          <span className="text-[13px] text-muted-foreground">
            {goingCount(session)} going
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showGroupLink && group && (
            <Button asChild variant="ghost" size="sm" className="hover:bg-primary-subtle-hover">
              <Link to={`/groups/${group.id}`}>Open group</Link>
            </Button>
          )}
          <Button asChild variant="primary" size="sm">
            <Link to={`/sessions/${session.id}`}>View session</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
