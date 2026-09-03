import * as React from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CalendarPlus, CircleSlash, History } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import {
  Card,
  EmptyState,
  PageHeader,
  SectionHeader,
  Skeleton,
  TabButton,
  Tabs,
} from '@/components/primitives'
import { SessionRow } from '@/components/SessionRow'
import { sessionsApi, type ApiSession } from '@/lib/api'
import { groupByDay, groupSessions } from '@/lib/sessions'
import { plural } from '@/lib/utils'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/state/AuthProvider'

type Tab = 'upcoming' | 'organizing' | 'past'

/** Stable identity so the memo below is not invalidated before data arrives. */
const EMPTY_SESSIONS: ApiSession[] = []

/**
 * The student's own calendar. Everything here is a session they organise, were
 * matched into, or belong to through a circle — never the whole course.
 */
export default function Schedule() {
  const { user } = useAuth()
  const [tab, setTab] = React.useState<Tab>('upcoming')

  const state = useAsync(() => sessionsApi.mine(), [])
  /* A fresh `?? []` on every render would defeat the memo below. */
  const sessions = state.data?.sessions ?? EMPTY_SESSIONS

  const grouped = React.useMemo(() => groupSessions(sessions, user?.id), [sessions, user?.id])
  const past = [...grouped.completed, ...grouped.cancelled]

  return (
    <Page>
      <PageHeader
        title="Schedule"
        description="Your confirmed study sessions."
        action={
          <Button asChild variant="primary">
            <Link to="/study-requests/new">
              <CalendarPlus />
              Find a session
            </Link>
          </Button>
        }
      />

      {state.error && (
        <Card variant="subtle" className="mb-6 border-danger/30">
          <p className="text-sm text-danger">{state.error}</p>
        </Card>
      )}

      {/* Sessions that already started but were never wrapped up are the one
          thing on this page that is genuinely waiting on the student. */}
      {grouped.awaitingWrapUp.length > 0 && (
        <Card variant="subtle" className="mb-6 border-warning/30 bg-warning-subtle/40">
          <p className="text-sm font-medium text-foreground">
            {plural(grouped.awaitingWrapUp.length, 'session')} still marked as planned
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            If they already happened, the organiser can mark them complete and record what the
            group got through.
          </p>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
            {grouped.awaitingWrapUp.slice(0, 3).map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </Card>
      )}

      <Tabs label="Schedule views" className="mb-6">
        <TabButton
          active={tab === 'upcoming'}
          onClick={() => setTab('upcoming')}
          count={grouped.upcoming.length}
        >
          Upcoming
        </TabButton>
        <TabButton
          active={tab === 'organizing'}
          onClick={() => setTab('organizing')}
          count={grouped.organizing.length}
        >
          Organizing
        </TabButton>
        <TabButton active={tab === 'past'} onClick={() => setTab('past')} count={past.length}>
          Past
        </TabButton>
      </Tabs>

      {state.loading && sessions.length === 0 ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : tab === 'upcoming' ? (
        <UpcomingView
          sessions={grouped.upcoming}
          needsRsvp={grouped.needsRsvp.length}
        />
      ) : tab === 'organizing' ? (
        grouped.organizing.length > 0 ? (
          <DayGroups sessions={grouped.organizing} />
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="You're not organizing anything"
            description="When you confirm a time on a study request you posted, you become the organiser of that session."
            actionLabel="Post a study request"
            to="/study-requests/new"
          />
        )
      ) : past.length > 0 ? (
        <div className="space-y-8">
          {grouped.completed.length > 0 && (
            <section>
              <SectionHeader title="Completed" count={grouped.completed.length} />
              <Card padded={false} className="overflow-hidden">
                <div className="divide-y divide-border">
                  {grouped.completed.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </Card>
            </section>
          )}

          {grouped.cancelled.length > 0 && (
            <section>
              <SectionHeader title="Cancelled" count={grouped.cancelled.length} />
              <Card padded={false} className="overflow-hidden">
                <div className="divide-y divide-border">
                  {grouped.cancelled.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </div>
              </Card>
            </section>
          )}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="Nothing in the past yet"
          description="Completed and cancelled sessions collect here."
        />
      )}
    </Page>
  )
}

function UpcomingView({
  sessions,
  needsRsvp,
}: {
  sessions: ReturnType<typeof groupSessions>['upcoming']
  needsRsvp: number
}) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No sessions coming up"
        description="Join a study request in one of your courses, or post your own — once a time is confirmed it lands here."
        actionLabel="Find study partners"
        to="/study-requests/new"
      />
    )
  }

  return (
    <>
      {needsRsvp > 0 && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2 text-[13px] text-foreground-soft">
          <CircleSlash className="size-3.5 text-warning" aria-hidden="true" />
          {plural(needsRsvp, 'session')} still waiting on your RSVP.
        </p>
      )}
      <DayGroups sessions={sessions} />
    </>
  )
}

/** Date-separated list — the shape a calendar is actually read in. */
function DayGroups({ sessions }: { sessions: ReturnType<typeof groupSessions>['upcoming'] }) {
  const days = groupByDay(sessions)

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <section key={day.label}>
          <h2 className="mb-2 px-1 text-eyebrow text-faint-foreground">{day.label}</h2>
          <Card padded={false} className="overflow-hidden">
            <div className="divide-y divide-border">
              {day.sessions.map((session) => (
                <SessionRow key={session.id} session={session} showDay={false} />
              ))}
            </div>
          </Card>
        </section>
      ))}
    </div>
  )
}
