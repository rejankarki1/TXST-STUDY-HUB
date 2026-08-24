import * as React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Check, ChevronRight, LogOut, MapPin, Trash2, Video } from 'lucide-react'
import type { Group, GroupMember, Session } from '@/data/types'
import { Button } from '@/components/ui/button'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { AvatarStack } from '@/components/Avatar'
import { Badge, Card, ConfirmDialog, CourseTag, Menu, Meta } from '@/components/primitives'
import { meetingStyleLabel, shortWhen } from '@/lib/format'
import { cn, courseVars } from '@/lib/utils'
import { isFull, isMember, membersOf, useNextGroupSession } from '@/state/selectors'

/**
 * The discovery unit. Answers, in reading order: what course, what group, why
 * it exists, who's in it, when they meet, can I join. At most two badges.
 *
 * Presentational: every mutation is a callback the page wires to an AppState
 * action, so the card works identically in demo mode and against the API.
 */
export function GroupCard({
  group,
  className,
  density = 'comfortable',
  showCourse = true,
  showMeta = false,
  nextSession,
  onJoin,
  onLeave,
  onDelete,
}: {
  group: Group
  className?: string
  /**
   * 'compact' is the Discover marketplace form: shorter, with the title as the
   * only group-detail link and Join as a separate action.
   */
  density?: 'comfortable' | 'compact'
  /** Off on the course page, where every card would repeat the same code. */
  showCourse?: boolean
  /** On where the course code isn't carrying the "what kind of group is this?"
   *  weight — the course page shows purpose and meeting style instead. */
  showMeta?: boolean
  /**
   * An already-resolved session, so a grid of cards doesn't rescan the store
   * once per card. `null` means "the caller looked and there is none"; omit it
   * entirely to let the card look the session up itself.
   */
  nextSession?: Session | null
  /* Returning the promise lets ConfirmDialog hold the dialog open until the
     mutation settles, and keep it open if the server refuses. It also lets the
     Join button show a pending state across the round trip. */
  onJoin?: () => void | Promise<void>
  onLeave?: () => void | Promise<void>
  onDelete?: () => void | Promise<void>
}) {
  /* Passing undefined skips the scan entirely — see useGroupSessions. */
  const fetched = useNextGroupSession(nextSession === undefined ? group.id : undefined)
  const next = nextSession ?? fetched
  const joined = isMember(group)
  const full = isFull(group)
  const members = membersOf(group)
  const memberCount = group.memberCount ?? members.length
  const online = group.meetingStyle === 'online'
  /* The server decides who owns a group; creatorId alone is not membership. */
  const creator = group.isCreator ?? false
  const [confirming, setConfirming] = React.useState<'leave' | 'delete' | null>(null)

  /* A creator cannot leave — the server returns 403 — so the menu offers
     Delete instead. Rendered only when the page gave us a handler for it. */
  const menuItems = joined
    ? [
        creator && onDelete && (
          <DropdownMenuItem key="delete" destructive onSelect={() => setConfirming('delete')}>
            <Trash2 />
            Delete group
          </DropdownMenuItem>
        ),
        !creator && onLeave && (
          <DropdownMenuItem key="leave" destructive onSelect={() => setConfirming('leave')}>
            <LogOut />
            Leave group
          </DropdownMenuItem>
        ),
      ].filter(Boolean)
    : []

  const body = {
    group,
    className,
    joined,
    full,
    creator,
    online,
    members,
    memberCount,
    next,
    menuItems,
    showCourse,
    showMeta,
    onJoin,
  }

  return (
    <>
      {density === 'compact' ? <CompactBody {...body} /> : <ComfortableBody {...body} />}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(isOpen) => !isOpen && setConfirming(null)}
        title={confirming === 'delete' ? `Delete "${group.name}"?` : `Leave "${group.name}"?`}
        description={
          confirming === 'delete'
            ? 'This permanently deletes the group along with its sessions and chat. This cannot be undone.'
            : 'You can rejoin later as long as the group still has room.'
        }
        confirmLabel={confirming === 'delete' ? 'Delete group' : 'Leave group'}
        destructive
        onConfirm={async () => {
          if (confirming === 'delete') await onDelete?.()
          else await onLeave?.()
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------- bodies */

type BodyProps = {
  group: Group
  className?: string
  joined: boolean
  full: boolean
  creator: boolean
  online: boolean
  members: GroupMember[]
  memberCount: number
  next: Session | undefined
  menuItems: React.ReactNode[]
  showCourse: boolean
  showMeta: boolean
  onJoin?: () => void | Promise<void>
}

/** The original card: the whole surface is the link. Used everywhere but Discover. */
function ComfortableBody({
  group,
  className,
  joined,
  full,
  creator,
  online,
  members,
  memberCount,
  next,
  menuItems,
  showCourse,
  showMeta,
  onJoin,
}: BodyProps) {
  return (
    <Card
      accent
      variant="interactive"
      to={`/groups/${group.id}`}
      label={group.name}
      style={courseVars(group.courseCode)}
      className={className}
    >
      <div className="flex items-start justify-between gap-3">
        {showCourse ? <CourseTag code={group.courseCode} /> : <span />}
        <div className="flex shrink-0 items-center gap-1.5">
          {online && <Badge icon={Video}>Online</Badge>}
          {full && !joined && <Badge tone="warning">Full</Badge>}
          {creator && <Badge>Creator</Badge>}
          {menuItems.length > 0 && (
            <Menu label={`${group.name} options`} className="-mr-2 -mt-1.5">
              {menuItems}
            </Menu>
          )}
        </div>
      </div>

      <h3 className="mt-2 text-[17px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover/card:text-primary">
        {group.name}
      </h3>

      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {group.description}
      </p>

      {showMeta && (
        <Meta className="mt-2" items={[group.purpose, meetingStyleLabel(group.meetingStyle)]} />
      )}

      <MemberSummary
        className="mt-4"
        members={members}
        memberCount={memberCount}
        maxMembers={group.maxMembers}
      />

      <div className="mt-3 min-h-[20px] rounded-lg bg-surface-sunken/55 px-3 py-2 text-[13px]">
        {next ? (
          <p className="flex flex-wrap items-center gap-x-1.5 text-foreground-soft">
            <Calendar className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{shortWhen(next.startsAt)}</span>
            <span aria-hidden="true" className="text-border-strong">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              {next.mode === 'online' ? (
                <Video className="size-3.5" aria-hidden="true" />
              ) : (
                <MapPin className="size-3.5" aria-hidden="true" />
              )}
              {next.location}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">No sessions scheduled yet</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
        <JoinAction joined={joined} full={full} onJoin={onJoin} groupName={group.name} stretched />
      </div>
    </Card>
  )
}

/**
 * The marketplace tile. Short enough to compare a screenful at a glance, so
 * nothing optional earns a reserved slot.
 *
 * No stretched activator: Card only paints one when given `to`, so passing
 * `variant="interactive"` alone keeps the hover lift while leaving the title
 * link and Join button as the only targets.
 */
function CompactBody({
  group,
  className,
  joined,
  full,
  creator,
  members,
  memberCount,
  next,
  menuItems,
  onJoin,
}: BodyProps) {
  const href = `/groups/${group.id}`

  return (
    <Card
      accent
      variant="interactive"
      padded={false}
      style={courseVars(group.courseCode)}
      className={cn('flex h-full min-h-[196px] flex-col p-4', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <CourseTag code={group.courseCode} size="sm" />
        <div className="flex shrink-0 items-center gap-1.5">
          {full && !joined ? (
            <Badge tone="warning">Full</Badge>
          ) : creator ? (
            <Badge>Creator</Badge>
          ) : null}
          {menuItems.length > 0 && (
            <Menu label={`${group.name} options`} className="-mr-1.5 -mt-1">
              {menuItems}
            </Menu>
          )}
        </div>
      </div>

      <h3 className="mt-2 line-clamp-1 text-[16px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover/card:text-primary">
        {group.name}
      </h3>

      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {group.description}
      </p>

      {/* Only when there is one. The client has no session data for groups you
          haven't joined, so a "none scheduled" line here would be a guess. */}
      {next && (
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium text-foreground-soft">{shortWhen(next.startsAt)}</span>
          <span aria-hidden="true" className="text-border-strong">
            ·
          </span>
          <span>{next.location}</span>
        </p>
      )}

      {/* Spacer rather than mt-auto: twMerge would drop it against the footer's mt-3. */}
      <div className="grow" />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-3">
        <MemberSummary
          compact
          members={members}
          memberCount={memberCount}
          maxMembers={group.maxMembers}
        />
        <div className="flex items-center gap-2">
          <Link
            to={href}
            className="group inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-primary"
          >
            View group
            <ChevronRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <JoinAction joined={joined} full={full} onJoin={onJoin} groupName={group.name} />
        </div>
      </div>
    </Card>
  )
}

/* --------------------------------------------------------------------- parts */

function MemberSummary({
  members,
  memberCount,
  maxMembers,
  compact,
  className,
}: {
  members: GroupMember[]
  memberCount: number
  maxMembers: number
  compact?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-2.5', className)}>
      <AvatarStack
        people={members}
        total={memberCount}
        max={compact ? 3 : 4}
        size={compact ? 'xs' : 'sm'}
      />
      <span className="text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground-soft">{memberCount}</span> of {maxMembers}
        {compact ? <span className="sr-only"> members</span> : ' members'}
      </span>
    </div>
  )
}

/**
 * Joining is two sequential round trips (join, then re-read /auth/me), so the
 * button holds a pending state rather than sitting inert for half a second.
 */
function JoinAction({
  joined,
  full,
  onJoin,
  groupName,
  stretched,
}: {
  joined: boolean
  full: boolean
  onJoin?: () => void | Promise<void>
  groupName: string
  /** Inside a card whose whole surface is a link, controls need to sit above it. */
  stretched?: boolean
}) {
  const [pending, setPending] = React.useState(false)
  const lift = stretched ? 'relative z-10' : undefined

  if (joined) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 text-[13px] font-medium text-success">
        <Check className="size-3.5" aria-hidden="true" />
        Joined
      </span>
    )
  }

  if (full) {
    return (
      <Button size="sm" variant="secondary" disabled className={lift}>
        Group full
      </Button>
    )
  }

  if (!onJoin) return null

  return (
    <Button
      size="sm"
      variant="primary"
      className={lift}
      disabled={pending}
      aria-label={`Join ${groupName}`}
      onClick={async () => {
        setPending(true)
        /* AppState already toasts on failure; this only clears the button. */
        try {
          await onJoin()
        } catch {
          /* handled upstream */
        } finally {
          setPending(false)
        }
      }}
    >
      {pending ? 'Joining…' : 'Join'}
    </Button>
  )
}
