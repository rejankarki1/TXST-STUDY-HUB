import { Users } from 'lucide-react'
import type { Group } from '@/data/types'
import { EmptyState, SectionHeader } from '@/components/primitives'
import { HomeGroupRow } from './HomeGroupRow'

/** One header, one action. "See all" is the only way out of this section. */
export function HomeGroups({
  groups,
  unread,
}: {
  groups: Group[]
  unread: Record<string, number>
}) {
  return (
    <section>
      <SectionHeader
        title="Your groups"
        count={groups.length || undefined}
        action={groups.length ? 'See all' : undefined}
        to={groups.length ? '/my-groups' : undefined}
      />

      {groups.length ? (
        <div className="space-y-2">
          {groups.map((group) => (
            <HomeGroupRow key={group.id} group={group} unread={unread[group.id]} />
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon={Users}
          title="You haven't joined any study groups yet"
          description="Find students in your courses and start studying together."
          actionLabel="Discover groups"
          to="/discover"
        />
      )}
    </section>
  )
}
