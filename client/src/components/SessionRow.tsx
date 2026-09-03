import { Link } from 'react-router-dom'
import { CalendarCheck, MapPin, Users, Video } from 'lucide-react'
import { Badge, CourseTag, Meta } from '@/components/primitives'
import { RSVP_LABELS, SESSION_STATUS_LABELS } from '@/lib/contracts'
import { dayLabel, timeRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ApiSession } from '@/lib/api'

const RSVP_TONES = {
  GOING: 'success',
  MAYBE: 'warning',
  CANT: 'neutral',
} as const

/** A session in a list. The whole row is the link; nothing else is clickable. */
export function SessionRow({
  session,
  showDay = true,
  showCourse = true,
  className,
}: {
  session: ApiSession
  showDay?: boolean
  showCourse?: boolean
  className?: string
}) {
  const dimmed = session.status === 'CANCELLED'

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
        dimmed && 'opacity-65',
        className,
      )}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-sunken text-muted-foreground">
        {session.mode === 'ONLINE' ? (
          <Video className="size-4" aria-hidden="true" />
        ) : (
          <MapPin className="size-4" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {showCourse && <CourseTag code={session.course.code} size="sm" />}
          <span
            className={cn(
              'truncate text-sm font-medium text-foreground',
              dimmed && 'line-through',
            )}
          >
            {session.title}
          </span>
        </span>

        <Meta
          className="mt-1"
          items={[
            showDay && `${dayLabel(session.startsAt)} · ${timeRange(session.startsAt, session.endsAt)}`,
            !showDay && timeRange(session.startsAt, session.endsAt),
            session.locationDetail
              ? `${session.location} · ${session.locationDetail}`
              : session.location,
            session.circle?.name,
            <>
              <Users className="size-3.5" aria-hidden="true" />
              {session.goingCount} going
            </>,
          ]}
        />
      </span>

      <span className="flex shrink-0 items-center gap-2 pt-0.5">
        {session.status !== 'PLANNED' ? (
          <Badge tone={session.status === 'COMPLETED' ? 'success' : 'neutral'}>
            {SESSION_STATUS_LABELS[session.status]}
          </Badge>
        ) : session.myRsvp ? (
          <Badge tone={RSVP_TONES[session.myRsvp]}>{RSVP_LABELS[session.myRsvp]}</Badge>
        ) : (
          <Badge tone="warning" icon={CalendarCheck}>
            RSVP
          </Badge>
        )}
      </span>
    </Link>
  )
}
