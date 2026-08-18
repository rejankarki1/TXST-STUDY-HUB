import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarX,
  Check,
  Clock,
  ExternalLink,
  HelpCircle,
  MapPin,
  Video,
  X,
} from 'lucide-react'
import type { RsvpStatus } from '@/data/types'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/primitives'
import { peopleById } from '@/data/people'
import { courseSlug } from '@/lib/courses'
import { fullDate, isPast, timeRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isMember, myRsvp, rsvpPeople, useGroup, useSession } from '@/state/selectors'

const OPTIONS: { id: RsvpStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: 'going', label: 'Going', icon: Check },
    { id: 'maybe', label: 'Maybe', icon: HelpCircle },
    { id: 'cant', label: "Can't go", icon: X },
  ]

export default function SessionDetail() {
  const { sessionId } = useParams()
  const session = useSession(sessionId)
  const group = useGroup(session?.groupId)
  const { state, setRsvp, refreshSession } = useApp()

  React.useEffect(() => {
    if (!sessionId) return
    void refreshSession(sessionId)
  }, [sessionId])

  if (state.sessionsLoading) {
    return (
      <Page>
        <EmptyState
          icon={CalendarX}
          title="Loading session"
          description="Fetching the latest RSVP details."
        />
      </Page>
    )
  }

  if (state.sessionsError && !session) {
    return (
      <Page>
        <EmptyState
          icon={CalendarX}
          title="Session could not load"
          description={state.sessionsError}
          actionLabel="Your sessions"
          to="/sessions"
        />
      </Page>
    )
  }

  if (!session || !group) {
    return (
      <Page>
        <EmptyState
          icon={CalendarX}
          title="This session doesn't exist"
          description="It may have been cancelled, or the link is wrong."
          actionLabel="Your sessions"
          to="/sessions"
        />
      </Page>
    )
  }

  const mine = myRsvp(session)
  const joined = isMember(group)
  const past = isPast(session.startsAt)
  const going = rsvpPeople(session, 'going')
  const maybe = rsvpPeople(session, 'maybe')
  const organizer = session.organizer ?? peopleById[session.organizerId]
  const online = session.mode === 'online'

  return (
    <Page>
      <Link
        to={`/groups/${group.id}/sessions`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        {group.name}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div>
          {/* ------------------------------------------------------ header */}
          <header>
            <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
              <Link
                to={`/groups/${group.id}`}
                className="font-medium text-foreground-soft hover:text-primary"
              >
                {group.name}
              </Link>
              <span aria-hidden="true" className="text-border-strong">·</span>
              <Link
                to={`/courses/${courseSlug(group.courseCode)}`}
                className="hover:text-primary"
              >
                {group.courseCode}
              </Link>
              {past && (
                <>
                  <span aria-hidden="true" className="text-border-strong">·</span>
                  <span>Past session</span>
                </>
              )}
            </p>

            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-foreground">
              {session.title}
            </h1>
          </header>

          {/* -------------------------------------------------- when/where */}
          <dl className="mt-6 grid gap-5 border-y border-border py-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-eyebrow text-faint-foreground">When</dt>
                <dd className="mt-1 text-[15px] font-medium text-foreground">
                  {fullDate(session.startsAt)}
                </dd>
                <dd className="text-sm text-muted-foreground">
                  {timeRange(session.startsAt, session.endsAt)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {online ? (
                <Video className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <MapPin className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <dt className="text-eyebrow text-faint-foreground">Where</dt>
                <dd className="mt-1 text-[15px] font-medium text-foreground">
                  {session.location}
                </dd>
                {session.locationDetail && (
                  <dd className="text-sm text-muted-foreground">{session.locationDetail}</dd>
                )}
                {online && session.meetingLink && (
                  <dd className="mt-1">
                    <a
                      href={session.meetingLink}
                      onClick={(e) => e.preventDefault()}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Join the call
                      <ExternalLink className="size-3.5" />
                    </a>
                  </dd>
                )}
              </div>
            </div>
          </dl>

          {/* -------------------------------------------------- description */}
          {session.description && (
            <section className="mt-7">
              <h2 className="text-sm font-semibold text-foreground">What we're covering</h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground-soft">
                {session.description}
              </p>
            </section>
          )}

          <p className="mt-7 flex items-center gap-2.5 text-[13px] text-muted-foreground">
            {organizer && <Avatar person={organizer} size="xs" />}
            Organized by{' '}
            <span className="font-medium text-foreground-soft">
              {organizer?.name ?? 'a member'}
            </span>
          </p>
        </div>

        {/* ---------------------------------------------------------- rsvp */}
        <aside className="lg:sticky lg:top-0 lg:self-start">
          {/* On desktop the RSVP sits in the rail; on mobile it becomes a
              pinned bar so it's always in reach without scrolling. */}
          <div className="hidden rounded-lg border border-border bg-surface p-5 lg:block">
            <RsvpBox
              past={past}
              joined={joined}
              mine={mine}
              groupId={group.id}
              groupName={group.name}
              onChange={(status) => void setRsvp(session.id, status)}
            />
          </div>

          {/* attendance */}
          <div className="mt-6 lg:mt-6">
            <h2 className="text-sm font-semibold text-foreground">
              {going.length} going
              {maybe.length > 0 && (
                <span className="ml-2 font-normal text-muted-foreground">
                  · {maybe.length} maybe
                </span>
              )}
            </h2>

            {going.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {going.map((person) => (
                  <li key={person.id} className="flex items-center gap-2.5">
                    <Avatar person={person} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground-soft">
                      {person.name}
                    </span>
                    {person.id === session.organizerId && (
                      <span className="shrink-0 text-xs text-faint-foreground">Organizer</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-muted-foreground">
                Nobody has said yes yet. Be the first.
              </p>
            )}

            {maybe.length > 0 && (
              <>
                <h3 className="mt-6 text-[13px] font-medium text-muted-foreground">Maybe</h3>
                <ul className="mt-2.5 space-y-2.5">
                  {maybe.map((person) => (
                    <li key={person.id} className="flex items-center gap-2.5">
                      <Avatar person={person} size="sm" className="opacity-70" />
                      <span className="truncate text-[13px] text-muted-foreground">
                        {person.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* mobile pinned RSVP */}
      <div className="safe-bottom sticky bottom-0 -mx-4 mt-8 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <RsvpBox
          past={past}
          joined={joined}
          mine={mine}
          groupId={group.id}
          groupName={group.name}
          onChange={(status) => void setRsvp(session.id, status)}
          compact
        />
      </div>
    </Page>
  )
}

/* --------------------------------------------------------------- RSVP UI */

function RsvpBox({
  past,
  joined,
  mine,
  groupId,
  groupName,
  onChange,
  compact,
}: {
  past: boolean
  joined: boolean
  mine: RsvpStatus | undefined
  groupId: string
  groupName: string
  onChange: (status: RsvpStatus) => void
  compact?: boolean
}) {
  if (past) {
    return <p className="text-sm text-muted-foreground">This session has already happened.</p>
  }

  if (!joined) {
    return compact ? (
      <Button asChild variant="primary" className="w-full">
        <Link to={`/groups/${groupId}`}>Join {groupName} to RSVP</Link>
      </Button>
    ) : (
      <>
        <p className="text-sm font-medium text-foreground">Join the group to RSVP</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Members can say whether they're coming and see who else will be there.
        </p>
        <Button asChild variant="primary" className="mt-4 w-full">
          <Link to={`/groups/${groupId}`}>View {groupName}</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      {!compact && (
        <p className="text-sm font-medium text-foreground">
          {mine ? 'Your answer' : 'Are you going?'}
        </p>
      )}

      <div
        role="group"
        aria-label="RSVP"
        className={cn(
          'grid grid-cols-3 gap-1 rounded-md bg-surface-sunken p-1',
          !compact && 'mt-3',
        )}
      >
        {OPTIONS.map(({ id, label, icon: Icon }) => {
          const on = mine === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(id)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-[5px] py-2 text-[13px] font-medium transition-colors',
                on
                  ? id === 'going'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-surface text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      {mine === 'going' && !compact && (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-success">
          <Check className="size-3.5" aria-hidden="true" />
          You're on the list. See you there.
        </p>
      )}
    </>
  )
}
