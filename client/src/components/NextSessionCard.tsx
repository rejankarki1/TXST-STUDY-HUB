import { Link } from 'react-router-dom'
import { Check, Clock, MapPin, Video } from 'lucide-react'
import type { Session } from '@/data/types'
import { Button } from '@/components/ui/button'
import { AvatarStack } from '@/components/Avatar'
import { Badge, CourseTag } from '@/components/primitives'
import { dayLabel, timeRange } from '@/lib/format'
import { cn, courseVars } from '@/lib/utils'
import { goingCount, myRsvp, rsvpPeople } from '@/state/selectors'

type CardGroup = { id: string; name: string; courseCode: string }

/**
 * The most important block in the product: the one thing the student needs to
 * know when they open the app. It wears the *course's* accent rather than
 * maroon — maroon is the app's own chrome, and this card belongs to a class.
 * Kept to a compact height so it never dominates the page.
 */
export function NextSessionCard({
  session,
  group,
  eyebrow = 'Next up',
  className,
  showGroupLink = true,
}: {
  session: Session
  /** Falls back to the group the API embeds on the session. */
  group?: CardGroup
  eyebrow?: string
  className?: string
  showGroupLink?: boolean
}) {
  const resolved: CardGroup | undefined =
    group ??
    (session.group
      ? {
          id: session.group.id,
          name: session.group.name,
          courseCode: session.group.course.code,
        }
      : undefined)

  const going = rsvpPeople(session, 'going')
  const mine = myRsvp(session)
  const online = session.mode === 'online'
  const courseCode = resolved?.courseCode

  return (
    <section
      style={courseCode ? courseVars(courseCode) : undefined}
      className={cn(
        'rounded-xl border p-5 shadow-card sm:p-6',
        courseCode
          ? 'border-(--course-border) bg-[linear-gradient(135deg,var(--course-subtle),var(--surface)_72%)]'
          : 'border-border bg-surface-raised',
        className,
      )}
      aria-label={`${eyebrow}: ${session.title}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn('text-eyebrow', courseCode ? 'text-(--course)' : 'text-muted-foreground')}>
          {eyebrow}
        </p>
        {courseCode && <CourseTag code={courseCode} size="sm" className="bg-surface/70" />}
      </div>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
        {session.title}
      </h2>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-lg bg-surface/65 px-3 py-2.5">
          <Clock
            className={cn('mt-0.5 size-4 shrink-0', courseCode ? 'text-(--course)' : 'text-muted-foreground')}
            aria-hidden="true"
          />
          <div className="text-sm leading-snug">
            <dt className="sr-only">When</dt>
            <dd className="font-medium text-foreground">{dayLabel(session.startsAt)}</dd>
            <dd className="text-muted-foreground">
              {timeRange(session.startsAt, session.endsAt)}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg bg-surface/65 px-3 py-2.5">
          {online ? (
            <Video
              className={cn('mt-0.5 size-4 shrink-0', courseCode ? 'text-(--course)' : 'text-muted-foreground')}
              aria-hidden="true"
            />
          ) : (
            <MapPin
              className={cn('mt-0.5 size-4 shrink-0', courseCode ? 'text-(--course)' : 'text-muted-foreground')}
              aria-hidden="true"
            />
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

      <div
        className={cn(
          'mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4',
          courseCode ? 'border-(--course-border)' : 'border-border',
        )}
      >
        <div className="flex items-center gap-2.5">
          <AvatarStack people={going} total={goingCount(session)} max={5} size="sm" />
          <span className="text-[13px] text-muted-foreground">{goingCount(session)} going</span>
          {mine === 'going' && (
            <Badge tone="success" icon={Check}>
              You're going
            </Badge>
          )}
          {mine === 'maybe' && <Badge tone="warning">You said maybe</Badge>}
        </div>

        <div className="flex items-center gap-2">
          {showGroupLink && resolved && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/groups/${resolved.id}`}>Open group</Link>
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
