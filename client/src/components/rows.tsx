import { Link } from 'react-router-dom'
import { Check, ChevronRight, MapPin, Video, X } from 'lucide-react'
import { format } from 'date-fns'
import type { ApiCourse } from '@/lib/api'
import type { Group, GroupMember, Session } from '@/data/types'
import { AvatarStack, Avatar } from '@/components/Avatar'
import { Badge, CourseTag } from '@/components/primitives'
import { dayLabel, shortWhen, time, timeRange } from '@/lib/format'
import { cn, courseVars, plural } from '@/lib/utils'
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
export function GroupRow({
  group,
  unread,
  creator,
  showCourse = true,
}: {
  group: Group
  unread?: number
  /** One quiet marker that this is a group you started. */
  creator?: boolean
  /** Off when the surrounding section already names the course. */
  showCourse?: boolean
}) {
  const next = useNextGroupSession(group.id)
  const members = membersOf(group)
  const memberCount = group.memberCount ?? members.length

  return (
    <Link
      to={`/groups/${group.id}`}
      style={courseVars(group.courseCode)}
      className="group flex items-center gap-3 border-l-[3px] border-l-(--course) py-3.5 pl-3 transition-[background-color,box-shadow] hover:bg-surface-hover sm:-mr-3 sm:rounded-r-lg sm:pr-3 sm:hover:shadow-xs"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
            {group.name}
          </p>
          {creator && <Badge>Creator</Badge>}
          {!!unread && (
            <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          {showCourse && (
            <>
              <CourseTag code={group.courseCode} size="sm" />
              <span aria-hidden="true" className="text-border-strong">
                ·
              </span>
            </>
          )}
          <span>{plural(memberCount, 'member')}</span>
          {next && (
            <>
              <span aria-hidden="true" className="text-border-strong">·</span>
              <span className="text-foreground-soft">{shortWhen(next.startsAt)}</span>
            </>
          )}
        </p>
      </div>

      <AvatarStack
        people={members}
        total={memberCount}
        max={3}
        size="sm"
        className="hidden sm:flex"
      />
      <ChevronRight
        className="size-4 shrink-0 text-faint-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        aria-hidden="true"
      />
    </Link>
  )
}

/* -------------------------------------------------------------------------
   Course row — one course in a list (Discover, Profile). The accent dot is
   the course's identity; the counts say whether there is anyone to study with.
   ---------------------------------------------------------------------- */
export function CourseRow({
  course,
  to,
  groupCount,
  studentCount,
  action,
}: {
  course: Pick<ApiCourse, 'id' | 'code' | 'title'>
  to: string
  groupCount?: number
  studentCount?: number
  /** Trailing control (a menu, a remove button). Sits above the row link. */
  action?: React.ReactNode
}) {
  const meta = [
    groupCount !== undefined && plural(groupCount, 'group'),
    studentCount !== undefined && studentCount > 0 && plural(studentCount, 'student'),
  ].filter(Boolean) as string[]

  return (
    <div className="relative flex items-center gap-3 py-3.5 transition-[background-color,box-shadow] hover:bg-surface-hover sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:shadow-xs">
      <Link to={to} className="absolute inset-0 z-0 rounded-md focus:outline-none">
        <span className="sr-only">{course.code}</span>
      </Link>
      <span
        style={courseVars(course.code)}
        className="size-2.5 shrink-0 rounded-full bg-(--course)"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{course.code}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {meta.length ? `${course.title} · ${meta.join(' · ')}` : course.title}
        </p>
      </div>
      {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
    </div>
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
  agenda,
  past,
  courseCode,
  className,
}: {
  session: Session
  showGroup?: string
  showDay?: boolean
  agenda?: boolean
  past?: boolean
  courseCode?: string
  className?: string
}) {
  const mine = myRsvp(session)
  const going = rsvpPeople(session, 'going')
  const attendeeCount = goingCount(session)

  if (agenda) {
    const start = new Date(session.startsAt)
    const meta = [courseCode, showGroup].filter(Boolean).join(' · ')

    return (
      <Link
        to={`/sessions/${session.id}`}
        style={courseCode ? courseVars(courseCode) : undefined}
        className={cn(
          'group flex gap-3 rounded-xl border p-3.5 transition-[transform,border-color,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-raised hover:shadow-card-hover',
          past
            ? 'border-border bg-surface/70 shadow-none'
            : 'border-border bg-surface shadow-card',
          className,
        )}
      >
        <div
          className={cn(
            'w-[74px] shrink-0 rounded-lg border px-2.5 py-2 text-center sm:w-[82px]',
            past
              ? 'border-border bg-surface-sunken/45 text-muted-foreground'
              : 'border-primary-border bg-primary-subtle text-primary',
          )}
        >
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-normal">
            {format(start, 'MMM d')}
          </p>
          <p
            className={cn(
              'mt-0.5 text-[13px] font-semibold tabular-nums leading-5',
              past ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {time(session.startsAt)}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  'truncate text-[15px] font-semibold leading-5 group-hover:text-primary',
                  past ? 'text-foreground-soft' : 'text-foreground',
                )}
              >
                {session.title}
              </p>
              {meta && (
                <p
                  className={cn(
                    'mt-0.5 truncate text-[13px]',
                    past ? 'text-muted-foreground' : 'text-foreground-soft',
                  )}
                >
                  {meta}
                </p>
              )}
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {!past && mine && <RsvpBadge status={mine} />}
              {!past && (
                <div className="flex items-center gap-2">
                  <AvatarStack people={going} total={attendeeCount} max={3} size="xs" />
                  <span className="text-xs text-muted-foreground">{attendeeCount}</span>
                </div>
              )}
              <ChevronRight
                className="size-4 text-faint-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <p
            className={cn(
              'mt-2 flex min-w-0 items-center gap-1.5 text-[13px]',
              past ? 'text-muted-foreground' : 'text-muted-foreground',
            )}
          >
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {session.location}
              {session.locationDetail ? ` · ${session.locationDetail}` : ''}
            </span>
          </p>

          {!past && mine && (
            <div className="mt-2 sm:hidden">
              <RsvpBadge status={mine} />
            </div>
          )}
        </div>

        <ChevronRight
          className="mt-1 size-4 shrink-0 text-faint-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground sm:hidden"
          aria-hidden="true"
        />
      </Link>
    )
  }

  return (
    <Link
      to={`/sessions/${session.id}`}
      className={cn(
        'group flex items-start gap-4 py-3.5 transition-[background-color,box-shadow] hover:bg-surface-hover sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:shadow-xs',
        className,
      )}
    >
      <div className="w-[72px] shrink-0 rounded-lg bg-surface-sunken px-2.5 py-2 sm:w-20">
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
          <AvatarStack people={going} total={goingCount(session)} max={3} size="xs" />
          <span className="text-xs text-muted-foreground">{goingCount(session)}</span>
        </div>
      </div>
    </Link>
  )
}

function RsvpBadge({ status }: { status: ReturnType<typeof myRsvp> }) {
  if (status === 'going') {
    return (
      <Badge tone="success" icon={Check}>
        Going
      </Badge>
    )
  }

  if (status === 'maybe') {
    return <Badge tone="warning">Maybe</Badge>
  }

  if (status === 'cant') {
    return (
      <Badge tone="neutral" icon={X}>
        Can't go
      </Badge>
    )
  }

  return null
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
        'group block py-4 transition-[background-color,box-shadow] hover:bg-surface-hover sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:shadow-xs',
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
            <AvatarStack people={going} total={goingCount(session)} max={4} size="xs" />
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
