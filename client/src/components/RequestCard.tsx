import { Clock, MapPin, Users, Video } from 'lucide-react'
import { Badge, Card, CourseTag, Meta } from '@/components/primitives'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { dayLabel, duration, time } from '@/lib/format'
import { plural } from '@/lib/utils'
import { canJoin, spotsLeft } from '@/lib/requests'
import {
  INTENT_LABELS,
  INTENT_TONES,
  MEETING_STYLE_LABELS,
  STUDY_REQUEST_STATUS_LABELS,
} from '@/lib/contracts'
import type { ApiStudyRequest } from '@/lib/api'

/**
 * One open ask, as it appears in a list.
 *
 * The intent badge is the first thing read — "needs help" and "can help" are
 * what make two students a match, so it outranks the topic visually.
 */
export function RequestCard({
  request,
  showCourse = true,
  onJoin,
  joining,
}: {
  request: ApiStudyRequest
  showCourse?: boolean
  onJoin?: () => void
  joining?: boolean
}) {
  const left = spotsLeft(request)
  const first = request.timeOptions[0]
  const joinable = canJoin(request)

  return (
    <Card
      accent
      variant="interactive"
      to={`/study-requests/${request.id}`}
      label={request.topic}
      style={{ ['--course' as string]: undefined }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={INTENT_TONES[request.intent]}>{INTENT_LABELS[request.intent]}</Badge>
        {showCourse && <CourseTag code={request.course.code} size="sm" />}
        {request.status !== 'OPEN' && (
          <Badge tone="neutral">{STUDY_REQUEST_STATUS_LABELS[request.status]}</Badge>
        )}
        {request.hasJoined && <Badge tone="primary">You're in</Badge>}
      </div>

      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">
          {request.topic}
        </h3>
        {request.details && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {request.details}
          </p>
        )}
      </div>

      <Meta
        items={[
          first && (
            <>
              <Clock className="size-3.5" aria-hidden="true" />
              {dayLabel(first.startsAt)} · {time(first.startsAt)}
              {request.timeOptions.length > 1 && ` +${request.timeOptions.length - 1} more`}
            </>
          ),
          <>
            {request.meetingStyle === 'ONLINE' ? (
              <Video className="size-3.5" aria-hidden="true" />
            ) : (
              <MapPin className="size-3.5" aria-hidden="true" />
            )}
            {request.location ?? MEETING_STYLE_LABELS[request.meetingStyle]}
          </>,
          first && duration(first.startsAt, first.endsAt),
        ]}
      />

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar person={request.creator} size="sm" />
          <span className="min-w-0 truncate text-[13px] text-muted-foreground">
            {request.creator.name}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            {left > 0 ? plural(left, 'spot') + ' left' : 'Full'}
          </span>
          {joinable && onJoin && (
            <Button
              size="sm"
              variant="subtle"
              className="relative z-10"
              disabled={joining}
              onClick={onJoin}
            >
              {joining ? 'Joining…' : 'Join'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
