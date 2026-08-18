import * as React from 'react'
import { Link, NavLink, Outlet, useMatch, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Users,
} from 'lucide-react'
import type { Group, GroupMember } from '@/data/types'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvatarStack } from '@/components/Avatar'
import { Badge, EmptyState } from '@/components/primitives'
import { courseSlug } from '@/lib/courses'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isFull, isMember, membersOf, useGroup } from '@/state/selectors'

export default function GroupLayout() {
  const { groupId } = useParams()
  const group = useGroup(groupId)
  const { state, joinGroup, leaveGroup, refreshGroup, refreshGroupSessions } = useApp()
  const navigate = useNavigate()
  const inChat = Boolean(useMatch('/groups/:groupId/chat'))

  React.useEffect(() => {
    if (!groupId) return
    void refreshGroup(groupId)
    void refreshGroupSessions(groupId)
  }, [groupId])

  if (state.groupsLoading) {
    return (
      <Page>
        <EmptyState
          icon={Users}
          title="Loading study group"
          description="Fetching the latest group details."
        />
      </Page>
    )
  }

  if (state.groupsError) {
    return (
      <Page>
        <EmptyState
          icon={Users}
          title="Study group could not load"
          description={state.groupsError}
          actionLabel="Browse groups"
          to="/discover"
        />
      </Page>
    )
  }

  if (!group) {
    return (
      <Page>
        <EmptyState
          icon={Users}
          title="This group doesn't exist"
          description="It may have been removed, or the link is wrong."
          actionLabel="Browse groups"
          to="/discover"
        />
      </Page>
    )
  }

  const joined = isMember(group)
  const full = isFull(group)
  const members = membersOf(group)
  const unread = state.unread[group.id] ?? 0

  const TABS = [
    { to: `/groups/${group.id}`, label: 'Overview', end: true },
    { to: `/groups/${group.id}/chat`, label: 'Chat', badge: unread },
    { to: `/groups/${group.id}/sessions`, label: 'Sessions' },
    { to: `/groups/${group.id}/members`, label: 'Members' },
  ]

  const tabs = (
    <div className="-mx-4 overflow-x-auto no-scrollbar px-4 sm:mx-0 sm:px-0">
      <nav className="flex w-max gap-1 border-b border-border" aria-label="Group sections">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
              )
            }
          >
            {tab.label}
            {!!tab.badge && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {tab.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )

  const actions = joined ? (
    <div className="flex items-center gap-2">
      <Button asChild variant="primary">
        <Link to={`/groups/${group.id}/chat`}>
          <MessageSquare />
          Open chat
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="Group options">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => navigate(`/groups/${group.id}/sessions/new`)}>
            <CalendarPlus />
            Schedule a session
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            onSelect={() => {
              void leaveGroup(group.id)
              navigate('/discover')
            }}
          >
            <LogOut />
            Leave group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : full ? (
    <Button variant="secondary" disabled>
      Group full
    </Button>
  ) : (
    <Button variant="primary" onClick={() => void joinGroup(group.id)}>
      Join group
    </Button>
  )

  /* ------------------------------------------------------------- chat mode
     The chat owns the viewport: header and tabs stay put on desktop and
     disappear entirely on mobile, where the transcript goes full screen. */
  if (inChat) {
    return (
      <div className="flex h-full flex-col">
        <div className="hidden shrink-0 px-6 pt-6 lg:block lg:px-8">
          <GroupHeading group={group} members={members} compact />
          <div className="mt-4">{tabs}</div>
        </div>
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <Page>
      <Link
        to="/discover"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary lg:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Discover
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <GroupHeading group={group} members={members} />
        <div className="shrink-0">{actions}</div>
      </div>

      <div className="mt-6">{tabs}</div>

      <div className="pt-6">
        <Outlet />
      </div>
    </Page>
  )
}

function GroupHeading({
  group,
  members,
  compact,
}: {
  group: Group
  members: GroupMember[]
  compact?: boolean
}) {
  const joined = isMember(group)

  /* Chat keeps its header to one line so the transcript gets the height. */
  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {group.name}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {members.length} members · {group.courseCode}
          </p>
        </div>
        <AvatarStack people={members} max={4} size="xs" className="ml-auto" />
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-2xl">
      <div className="flex items-center gap-2">
        <Link
          to={`/courses/${courseSlug(group.courseCode)}`}
          className="text-eyebrow text-muted-foreground transition-colors hover:text-primary"
        >
          {group.courseCode}
        </Link>
        {joined && (
          <Badge tone="success" icon={Check}>
            Joined
          </Badge>
        )}
      </div>

      <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-foreground">
        {group.name}
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.description}</p>

      <div className="mt-3 flex items-center gap-2.5">
        <AvatarStack people={members} max={5} size="sm" />
        <span className="text-[13px] text-muted-foreground">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </span>
      </div>
    </div>
  )
}
