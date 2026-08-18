import * as React from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, CalendarX } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, SectionHeader } from '@/components/primitives'
import { SessionRow } from '@/components/rows'
import { useApp } from '@/state/AppState'
import { useMyGroups, useMySessions } from '@/state/selectors'

export default function SessionsPage() {
  const { state, refreshSessions } = useApp()
  const myGroups = useMyGroups()
  const { upcoming, past } = useMySessions()
  const names = new Map(state.groups.map((group) => [group.id, group.name]))
  const firstGroup = myGroups[0]

  React.useEffect(() => {
    void refreshSessions()
  }, [])

  if (state.sessionsLoading) {
    return (
      <Page>
        <EmptyState
          icon={CalendarX}
          title="Loading sessions"
          description="Fetching your study schedule."
        />
      </Page>
    )
  }

  if (state.sessionsError) {
    return (
      <Page>
        <EmptyState
          icon={CalendarX}
          title="Sessions could not load"
          description={state.sessionsError}
          actionLabel="Try again"
          onAction={() => void refreshSessions()}
        />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Sessions"
        description="Your upcoming study plans across every group you have joined."
        action={
          firstGroup && (
            <Button asChild variant="primary">
              <Link to={`/groups/${firstGroup.id}/sessions/new`}>
                <CalendarPlus />
                Schedule
              </Link>
            </Button>
          )
        }
      />

      {upcoming.length ? (
        <section>
          <SectionHeader title="Upcoming" count={upcoming.length} />
          <div className="divide-y divide-border border-y border-border">
            {upcoming.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                showDay
                showGroup={names.get(session.groupId)}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={CalendarX}
          title="No upcoming sessions"
          description={
            firstGroup
              ? 'Plan a session with one of your groups and it will show up here.'
              : 'Join a group first, then you can schedule or RSVP to study sessions.'
          }
          actionLabel={firstGroup ? 'Schedule session' : 'Discover groups'}
          to={firstGroup ? `/groups/${firstGroup.id}/sessions/new` : '/discover'}
        />
      )}

      {past.length > 0 && (
        <section className="mt-9">
          <SectionHeader title="Past sessions" count={past.length} />
          <div className="divide-y divide-border border-y border-border">
            {past.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                showDay
                showGroup={names.get(session.groupId)}
              />
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}
