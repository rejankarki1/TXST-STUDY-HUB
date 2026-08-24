import * as React from 'react'
import { CalendarX } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { EmptyState, PageHeader, SectionHeader } from '@/components/primitives'
import { ScheduleSessionButton } from '@/components/ScheduleSessionButton'
import { SessionRow } from '@/components/rows'
import { useApp } from '@/state/AppState'
import { useMyGroups, useMySessions } from '@/state/selectors'

export default function SessionsPage() {
  const { state, refreshSessions } = useApp()
  const myGroups = useMyGroups()
  const { upcoming, past } = useMySessions()
  const groupsById = new Map(state.groups.map((group) => [group.id, group]))
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
        action={<ScheduleSessionButton groups={myGroups}>Schedule</ScheduleSessionButton>}
      />

      {upcoming.length ? (
        <section>
          <SectionHeader title="Upcoming" count={upcoming.length} />
          <div className="space-y-3">
            {upcoming.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                agenda
                courseCode={groupsById.get(session.groupId)?.courseCode}
                showDay
                showGroup={groupsById.get(session.groupId)?.name}
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
          actionLabel={firstGroup ? undefined : 'Discover groups'}
          to={firstGroup ? undefined : '/discover'}
        >
          <ScheduleSessionButton groups={myGroups} variant="secondary" size="sm" icon={false} />
        </EmptyState>
      )}

      {past.length > 0 && (
        <section className="mt-9">
          <SectionHeader title="Past sessions" count={past.length} />
          <div className="space-y-2.5">
            {past.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                agenda
                past
                courseCode={groupsById.get(session.groupId)?.courseCode}
                showDay
                showGroup={groupsById.get(session.groupId)?.name}
              />
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}
