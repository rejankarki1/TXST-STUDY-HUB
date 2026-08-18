import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarPlus, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/primitives'
import { SessionListItem } from '@/components/rows'
import { cn } from '@/lib/utils'
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

      <div className="mt-5 flex gap-1 border-b border-border">
        {(['upcoming', 'past'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm capitalize transition-colors',
              tab === id
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {id}
            <span className="ml-1.5 text-xs text-faint-foreground">
              {id === 'upcoming' ? upcoming.length : past.length}
            </span>
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="mt-2 divide-y divide-border">
          {list.map((session) => (
            <SessionListItem key={session.id} session={session} past={tab === 'past'} />
          ))}
        </div>
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
