import { CalendarClock, Users } from 'lucide-react'
import { Badge, Card, CourseTag, Meta } from '@/components/primitives'
import { AvatarStack } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { CIRCLE_PURPOSE_LABELS, MEETING_STYLE_LABELS } from '@/lib/contracts'
import { plural } from '@/lib/utils'
import type { ApiCircle } from '@/lib/api'

/** A recurring team. The roster and the cadence are the point, so both lead. */
export function CircleCard({
  circle,
  showCourse = true,
  onJoin,
  joining,
}: {
  circle: ApiCircle
  showCourse?: boolean
  onJoin?: () => void
  joining?: boolean
}) {
  const joinable = !circle.isMember && !circle.isFull && circle.status === 'ACTIVE'

  return (
    <Card
      variant="interactive"
      to={`/circles/${circle.id}`}
      label={circle.name}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {showCourse && <CourseTag code={circle.course.code} size="sm" />}
        <Badge tone="neutral">{CIRCLE_PURPOSE_LABELS[circle.purpose]}</Badge>
        {circle.status === 'ARCHIVED' && <Badge tone="neutral">Archived</Badge>}
        {circle.isMember && <Badge tone="primary">Member</Badge>}
      </div>

      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{circle.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {circle.description}
        </p>
      </div>

      <Meta
        items={[
          circle.term,
          MEETING_STYLE_LABELS[circle.meetingStyle],
          circle.recurringSchedule && (
            <>
              <CalendarClock className="size-3.5" aria-hidden="true" />
              {circle.recurringSchedule}
            </>
          ),
        ]}
      />

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <AvatarStack
            people={circle.members}
            total={circle.memberCount}
            label={plural(circle.memberCount, 'member')}
          />
          <span className="inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            <Users className="size-3.5" aria-hidden="true" />
            {circle.memberCount}/{circle.maxMembers}
          </span>
        </div>

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
    </Card>
  )
}
