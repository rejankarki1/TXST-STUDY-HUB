import { useParams } from 'react-router-dom'
import { MemberRow } from '@/components/rows'
import { VIEWER_ID } from '@/data/people'
import { useApp } from '@/state/AppState'
import { membersOf, useGroup } from '@/state/selectors'

export default function GroupMembers() {
  const { groupId } = useParams()
  const { state } = useApp()
  const group = useGroup(groupId)
  if (!group) return null

  const members = membersOf(group)
  /* Creator first, then you, then everyone else — social ordering, not alphabetical. */
  const ordered = [...members].sort((a, b) => {
    const currentUserId = state.currentUser?.id ?? VIEWER_ID
    const rank = (id: string) => (id === group.creatorId ? 0 : id === currentUserId ? 1 : 2)
    return rank(a.id) - rank(b.id)
  })

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Members</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {members.length} {members.length === 1 ? 'student' : 'students'} · room for{' '}
        {group.spotsLeft ?? Math.max(group.maxMembers - members.length, 0)} more
      </p>

      <div className="mt-5 divide-y divide-border border-y border-border">
        {ordered.map((person) => (
          <MemberRow
            key={person.id}
            person={person}
            isCreator={person.id === group.creatorId}
            isYou={person.id === (state.currentUser?.id ?? VIEWER_ID)}
          />
        ))}
      </div>
    </div>
  )
}
