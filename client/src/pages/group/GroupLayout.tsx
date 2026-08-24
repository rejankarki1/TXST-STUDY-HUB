import * as React from 'react'
import { Link, NavLink, Outlet, useMatch, useNavigate, useParams } from 'react-router-dom'
import { CalendarPlus, Check, Trash2, LogOut, MessageSquare, Users } from 'lucide-react'
import type { Group, GroupMember } from '@/data/types'
import { Page } from '@/layouts/AppShell'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AvatarStack } from '@/components/Avatar'
import {
  Badge,
  Breadcrumb,
  Card,
  ConfirmDialog,
  CourseTag,
  EmptyState,
  Menu,
  Tabs,
  tabClass,
} from '@/components/primitives'
import { courseForGroup, courseHref } from '@/lib/courses'
import { courseVars, plural } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { isFull, isMember, membersOf, useGroup } from '@/state/selectors'

export default function GroupLayout() {
  const { groupId } = useParams()
  const group = useGroup(groupId)
  const { state, joinGroup, leaveGroup, deleteGroup, refreshGroup, refreshGroupSessions } = useApp()
  const navigate = useNavigate()
  const inChat = Boolean(useMatch('/groups/:groupId/chat'))
  const [confirming, setConfirming] = React.useState<'leave' | 'delete' | null>(null)

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
  const creator = group.isCreator ?? group.creatorId === state.currentUser?.id
  const full = isFull(group)
  const members = membersOf(group)
  const unread = state.unread[group.id] ?? 0
  // Resolve the parent course by id; the code is only a display string.
  const course = courseForGroup(state.courses, group)
  const courseDestination = courseHref(course ?? { code: group.courseCode })

  const confirmLeave = async () => {
    await leaveGroup(group.id)
    navigate(courseDestination)
  }

  const confirmDelete = async () => {
    await deleteGroup(group.id)
    navigate(courseDestination)
  }

  const TABS = [
    { to: `/groups/${group.id}`, label: 'Overview', end: true },
    { to: `/groups/${group.id}/chat`, label: 'Chat', badge: unread },
    { to: `/groups/${group.id}/sessions`, label: 'Sessions' },
    { to: `/groups/${group.id}/members`, label: 'Members' },
  ]

  const tabs = (
    <Tabs label="Group sections">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => tabClass(isActive)}>
          {tab.label}
          {!!tab.badge && (
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {tab.badge}
            </span>
          )}
        </NavLink>
      ))}
    </Tabs>
  )

  const actions = joined ? (
    <div className="flex items-center gap-2">
      <Button asChild variant="primary">
        <Link to={`/groups/${group.id}/chat`}>
          <MessageSquare />
          Open chat
        </Link>
      </Button>
      <Menu label="Group options">
        <DropdownMenuItem onSelect={() => navigate(`/groups/${group.id}/sessions/new`)}>
          <CalendarPlus />
          Schedule a session
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* The creator cannot leave — the server refuses it — so they get Delete. */}
        {creator ? (
          <DropdownMenuItem destructive onSelect={() => setConfirming('delete')}>
            <Trash2 />
            Delete group
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem destructive onSelect={() => setConfirming('leave')}>
            <LogOut />
            Leave group
          </DropdownMenuItem>
        )}
      </Menu>
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
      <Breadcrumb
        className="mb-4"
        items={[
          {
            label: course?.code ?? group.courseCode,
            to: courseDestination,
            title: course?.title ?? group.course?.title,
          },
          { label: group.name },
        ]}
      />


      <Card variant="raised" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <GroupHeading group={group} members={members} />
        <div className="shrink-0">{actions}</div>
      </div>

      <div className="mt-6">{tabs}</div>
      </Card>

      <div className="pt-6">
        <Outlet />
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(isOpen) => !isOpen && setConfirming(null)}
        title={confirming === 'delete' ? `Delete "${group.name}"?` : `Leave "${group.name}"?`}
        description={
          confirming === 'delete'
            ? 'This permanently deletes the study group along with its sessions and chat. This cannot be undone.'
            : 'You can rejoin later as long as the group still has room. The course stays in My Courses.'
        }
        confirmLabel={confirming === 'delete' ? 'Delete group' : 'Leave group'}
        destructive
        onConfirm={confirming === 'delete' ? confirmDelete : confirmLeave}
      />
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
  const memberCount = group.memberCount ?? members.length

  /* Chat keeps its header to one line so the transcript gets the height. */
  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <span
          style={courseVars(group.courseCode)}
          className="h-8 w-1 shrink-0 rounded-full bg-(--course)"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {group.name}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {plural(memberCount, 'member')} · {group.courseCode}
          </p>
        </div>
        <AvatarStack
          people={members}
          total={memberCount}
          max={4}
          size="xs"
          className="ml-auto"
        />
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <CourseTag code={group.courseCode} />
        {joined && (
          <Badge tone="success" icon={Check}>
            Joined
          </Badge>
        )}
        {group.isCreator && <Badge>Creator</Badge>}
      </div>

      <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-foreground">
        {group.name}
      </h1>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{group.description}</p>

      <div className="mt-3 flex items-center gap-2.5">
        <AvatarStack people={members} total={memberCount} max={5} size="sm" />
        <span className="text-[13px] text-muted-foreground">{plural(memberCount, 'member')}</span>
      </div>
    </div>
  )
}
