import * as React from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState, PageHeader, SectionHeader } from '@/components/primitives'
import { GroupCard } from '@/components/GroupCard'
import { GroupRow } from '@/components/rows'
import { useApp } from '@/state/AppState'
import { isMember, useGroupsCreatedByMe, useMyGroups, useSuggestedGroups } from '@/state/selectors'

export default function MyGroups() {
  const { state, refreshMyGroups } = useApp()
  const myGroups = useMyGroups()
  const created = useGroupsCreatedByMe()
  const suggestions = useSuggestedGroups(3)

  React.useEffect(() => {
    void refreshMyGroups()
  }, [])

  return (
    <Page>
      <PageHeader
        title="My groups"
        description="Keep up with your study groups and the sessions they are planning."
        action={
          <Button asChild variant="primary">
            <Link to="/groups/new">
              <Plus />
              Create group
            </Link>
          </Button>
        }
      />

      {state.groupsLoading && (
        <p className="mb-5 text-sm text-muted-foreground">Loading your study groups...</p>
      )}

      {state.groupsError && (
        <EmptyState
          className="mb-5"
          icon={Users}
          title="Study groups could not load"
          description={state.groupsError}
        />
      )}

      {!state.groupsError && myGroups.length ? (
        <section>
          <SectionHeader title="Joined groups" count={myGroups.length} />
          <div className="divide-y divide-border border-y border-border">
            {myGroups.map((group) => (
              <GroupRow key={group.id} group={group} unread={state.unread[group.id]} />
            ))}
          </div>
        </section>
      ) : !state.groupsError && !state.groupsLoading ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Join a group in one of your courses, or start one for classmates to find."
          actionLabel="Discover groups"
          to="/discover"
        />
      ) : null}

      {created.length > 0 && (
        <section className="mt-9">
          <SectionHeader title="Created by you" count={created.length} />
          <div className="grid gap-4 lg:grid-cols-2">
            {created.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="mt-9">
          <SectionHeader title="Suggested groups" action="Browse all" to="/discover" />
          <div className="grid gap-4 lg:grid-cols-3">
            {suggestions.filter((group) => !isMember(group)).map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}
