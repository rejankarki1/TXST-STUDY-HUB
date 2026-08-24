import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarPlus, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, EmptyState, TabButton, Tabs } from '@/components/primitives'
import { SessionListItem } from '@/components/rows'
import { useApp } from '@/state/AppState'
import { isMember, useGroup, useGroupSessions } from '@/state/selectors'

export default function GroupSessions() {
  const { groupId } = useParams()
  const group = useGroup(groupId)
  const { state, refreshGroupSessions } = useApp()
  const { upcoming, past } = useGroupSessions(groupId)
  const [tab, setTab] = React.useState<'upcoming' | 'past'>('upcoming')

  if (!group) return null
  const joined = isMember(group)
  const list = tab === 'upcoming' ? upcoming : past

  if (state.sessionsLoading) {
    return (
      <EmptyState
        className="mt-6"
        icon={CalendarPlus}
        title="Loading sessions"
        description="Fetching this group's study sessions."
        compact
      />
    )
  }

  if (state.sessionsError) {
    return (
      <EmptyState
        className="mt-6"
        icon={History}
        title="Sessions could not load"
        description={state.sessionsError}
        actionLabel="Try again"
        onAction={() => groupId && void refreshGroupSessions(groupId)}
        compact
      />
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Study sessions</h2>
        {joined && (
          <Button asChild variant="primary" size="sm">
            <Link to={`/groups/${group.id}/sessions/new`}>
              <CalendarPlus />
              Schedule session
            </Link>
          </Button>
        )}
      </div>

      <Tabs label="Session history" className="mt-5">
        {(['upcoming', 'past'] as const).map((id) => (
          <TabButton
            key={id}
            active={tab === id}
            onClick={() => setTab(id)}
            count={id === 'upcoming' ? upcoming.length : past.length}
          >
            <span className="capitalize">{id}</span>
          </TabButton>
        ))}
      </Tabs>

      {list.length ? (
        <Card padded={false} className="mt-4 overflow-hidden">
        <div className="divide-y divide-border">
          {list.map((session) => (
            <SessionListItem key={session.id} session={session} past={tab === 'past'} />
          ))}
        </div>
        </Card>
      ) : tab === 'upcoming' ? (
        <EmptyState
          className="mt-6"
          icon={CalendarPlus}
          title="Nothing scheduled yet"
          description={
            joined
              ? 'Pick a time and place, and everyone in the group gets an invite.'
              : 'This group hasn’t planned its next session.'
          }
          actionLabel={joined ? 'Schedule session' : undefined}
          to={joined ? `/groups/${group.id}/sessions/new` : undefined}
        />
      ) : (
        <EmptyState
          className="mt-6"
          icon={History}
          title="No past sessions"
          description="Once the group has met, sessions will show up here."
          compact
        />
      )}
    </div>
  )
}
