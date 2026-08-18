import { Link } from 'react-router-dom'
import { Check, ChevronRight, MapPin, Video } from 'lucide-react'
import type { Group, GroupMember, Session } from '@/data/types'
import { AvatarStack, Avatar } from '@/components/Avatar'
import { Badge } from '@/components/primitives'
import { dayLabel, shortWhen, time, timeRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  goingCount,
  membersOf,
  myRsvp,
  rsvpPeople,
  useNextGroupSession,
} from '@/state/selectors'

/* -------------------------------------------------------------------------
   Group row — the list form used on Home and My Groups. Deliberately not a
   card: stacked cards at this density turn the page into wallpaper.
   ---------------------------------------------------------------------- */
export function GroupRow({ group, unread }: { group: Group; unread?: number }) {
  const next = useNextGroupSession(group.id)
  const members = membersOf(group)

  return (
    <Link
      to={`/groups/${group.id}`}
      className="group flex items-center gap-4 py-3.5 transition-colors hover:bg-surface-sunken/60 sm:-mx-3 sm:px-3 sm:rounded-md"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
            {group.name}
          </p>
          {!!unread && (
            <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground-soft">{group.courseCode}</span>
          <span aria-hidden="true" className="text-border-strong">·</span>
          <span>{group.memberCount ?? members.length} members</span>
          {next && (
            <>
              <span aria-hidden="true" className="text-border-strong">·</span>
              <span className="text-foreground-soft">{shortWhen(next.startsAt)}</span>
            </>
          )}
        </p>
      </div>

      <AvatarStack people={members} max={3} size="sm" className="hidden sm:flex" />
      <ChevronRight
        className="size-4 shrink-0 text-faint-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        aria-hidden="true"
      />
    </Link>
  )
}

/* -------------------------------------------------------------------------
   Session row — an agenda line. Time sits in its own left column so a list of
   sessions scans vertically like a schedule.
   ---------------------------------------------------------------------- */
export function SessionRow({
  session,
  showGroup,
  showDay,
  className,
}: {
  session: Session
  showGroup?: string
  showDay?: boolean
  className?: string
}) {
  const mine = myRsvp(session)
  const going = rsvpPeople(session, 'going')

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={cn(
        'group flex items-start gap-4 py-3.5 transition-colors hover:bg-surface-sunken/60 sm:-mx-3 sm:px-3 sm:rounded-md',
        className,
      )}
    >
      <div className="w-[68px] shrink-0 sm:w-20">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {time(session.startsAt)}
        </p>
        <p className="text-xs text-muted-foreground">
          {showDay ? dayLabel(session.startsAt) : `${duration(session)}`}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {session.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          {showGroup && (
            <>
              <span className="text-foreground-soft">{showGroup}</span>
              <span aria-hidden="true" className="text-border-strong">·</span>
            </>
          )}
          <span className="inline-flex items-center gap-1">
            {session.mode === 'online' ? (
              <Video className="size-3.5" aria-hidden="true" />
            ) : (
              <MapPin className="size-3.5" aria-hidden="true" />
            )}
            {session.location}
          </span>
          {session.locationDetail && (
            <>
              <span aria-hidden="true" className="text-border-strong">·</span>
              <span>{session.locationDetail}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {mine === 'going' && (
          <Badge tone="success" icon={Check} className="hidden sm:inline-flex">
            Going
          </Badge>
        )}
        {mine === 'maybe' && (
          <Badge tone="warning" className="hidden sm:inline-flex">
            Maybe
          </Badge>
        )}
        <div className="hidden items-center gap-2 sm:flex">
          <AvatarStack people={going} max={3} size="xs" />
          <span className="text-xs text-muted-foreground">{goingCount(session)}</span>
        </div>
      </div>
    </Link>
  )
}

function duration(session: Session) {
  const mins =
    (new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime()) / 60000
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/* -------------------------------------------------------------------------
   Session card — the fuller form used inside a group's Sessions tab, where
   the date is the primary scanning key.
   ---------------------------------------------------------------------- */
export function SessionListItem({ session, past }: { session: Session; past?: boolean }) {
  const going = rsvpPeople(session, 'going')
  const mine = myRsvp(session)

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={cn(
        'group block py-4 transition-colors hover:bg-surface-sunken/60 sm:-mx-3 sm:px-3 sm:rounded-md',
        past && 'opacity-70 hover:opacity-100',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground group-hover:text-primary">
            {session.title}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {dayLabel(session.startsAt)} · {timeRange(session.startsAt, session.endsAt)}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted-foreground">
            {session.mode === 'online' ? (
              <Video className="size-3.5" aria-hidden="true" />
            ) : (
              <MapPin className="size-3.5" aria-hidden="true" />
            )}
            {session.location}
            {session.locationDetail && ` · ${session.locationDetail}`}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {!past && mine === 'going' && (
            <Badge tone="success" icon={Check}>
              Going
            </Badge>
          )}
          {!past && mine === 'maybe' && <Badge tone="warning">Maybe</Badge>}
          <div className="flex items-center gap-2">
            <AvatarStack people={going} max={4} size="xs" />
            <span className="text-xs text-muted-foreground">
              {goingCount(session)} {past ? 'went' : 'going'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* -------------------------------------------------------------------------
   Member row — social, not administrative. No permissions column.
   ---------------------------------------------------------------------- */
export function MemberRow({
  person,
  isCreator,
  isYou,
}: {
  person: GroupMember
  isCreator?: boolean
  isYou?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Avatar person={person} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {person.name}
          {isYou && <span className="ml-1.5 text-[13px] font-normal text-faint-foreground">(you)</span>}
        </p>
        <p className="truncate text-[13px] text-muted-foreground">
          {person.major ?? 'Major not set'}
          {person.gradYear ? ` · Class of ${person.gradYear}` : ''}
        </p>
      </div>
      {isCreator && (
        <span className="shrink-0 text-[13px] text-muted-foreground">Group creator</span>
      )}
    </div>
  )
}
