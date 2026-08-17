import { Link } from 'react-router-dom'
import { Calendar, Check, MapPin, Video } from 'lucide-react'
import type { Group } from '@/data/types'
import { Button } from '@/components/ui/button'
import { AvatarStack } from '@/components/Avatar'
import { Badge, CourseLabel } from '@/components/primitives'
import { shortWhen } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isFull, isMember, membersOf, useNextGroupSession } from '@/state/selectors'

/**
 * The discovery unit. Answers, in reading order: what course, what group, why
 * it exists, who's in it, when they meet, can I join. At most two badges.
 */
export function GroupCard({ group, className }: { group: Group; className?: string }) {
  const { joinGroup } = useApp()
  const next = useNextGroupSession(group.id)
  const joined = isMember(group)
  const full = isFull(group)
  const members = membersOf(group)
  const online = group.meetingStyle === 'online'

  return (
    <article
      className={cn(
        'group flex flex-col rounded-lg border border-border bg-surface p-5 shadow-xs transition-colors hover:border-border-strong',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <CourseLabel code={group.courseCode} />
        <div className="flex shrink-0 items-center gap-1.5">
          {online && <Badge icon={Video}>Online</Badge>}
          {full && !joined && <Badge tone="warning">Full</Badge>}
        </div>
      </div>

      <h3 className="mt-1.5 text-[17px] font-semibold leading-snug tracking-tight text-foreground">
        <Link to={`/groups/${group.id}`} className="hover:text-primary">
          {group.name}
        </Link>
      </h3>

      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {group.description}
      </p>

      <div className="mt-4 flex items-center gap-2.5">
        <AvatarStack people={members} max={4} size="sm" />
        <span className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground-soft">{members.length}</span> of{' '}
          {group.maxMembers} members
        </span>
      </div>

      <div className="mt-3 min-h-[20px] text-[13px]">
        {next ? (
          <p className="flex flex-wrap items-center gap-x-1.5 text-foreground-soft">
            <Calendar className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{shortWhen(next.startsAt)}</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              {next.mode === 'online' ? (
                <Video className="size-3.5" aria-hidden="true" />
              ) : (
                <MapPin className="size-3.5" aria-hidden="true" />
              )}
              {next.location}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">No sessions scheduled yet</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/groups/${group.id}`}>View group</Link>
        </Button>
        {joined ? (
          <span className="inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-medium text-success">
            <Check className="size-3.5" aria-hidden="true" />
            Joined
          </span>
        ) : full ? (
          <Button size="sm" variant="secondary" disabled>
            Group full
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={() => joinGroup(group.id)}>
            Join
          </Button>
        )}
      </div>
    </article>
  )
}
