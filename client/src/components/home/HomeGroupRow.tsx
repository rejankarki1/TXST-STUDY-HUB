import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Group } from '@/data/types'
import { AvatarStack } from '@/components/Avatar'
import { Badge, CourseTag } from '@/components/primitives'
import { shortWhen } from '@/lib/format'
import { courseVars, plural } from '@/lib/utils'
import { membersOf, useNextGroupSession } from '@/state/selectors'

/**
 * Home's group row. Unlike the My Groups list this one is self-contained — it
 * names its own course, so Home needs no per-course headings above it and no
 * second "View course" link beside it. The whole row is the target; the course
 * is reachable from the sidebar and from inside the group.
 */
export function HomeGroupRow({
  group,
  unread,
}: {
  group: Group
  unread?: number
}) {
  const next = useNextGroupSession(group.id)
  const members = membersOf(group)
  const memberCount = group.memberCount ?? members.length

  return (
    <Link
      to={`/groups/${group.id}`}
      style={courseVars(group.courseCode)}
      className="group flex items-center gap-3 rounded-xl border border-border border-l-[3px] border-l-(--course) bg-surface px-4 py-3.5 shadow-xs transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-px hover:border-border-strong hover:shadow-sm active:translate-y-0"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CourseTag code={group.courseCode} size="sm" />
          {group.isCreator && <Badge>Creator</Badge>}
          {!!unread && (
            <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm font-medium text-foreground group-hover:text-primary">
          {group.name}
        </p>

        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-muted-foreground">
          <span>{plural(memberCount, 'member')}</span>
          <span aria-hidden="true" className="text-border-strong">
            ·
          </span>
          {next ? (
            <span className="text-foreground-soft">{shortWhen(next.startsAt)}</span>
          ) : (
            <span>No upcoming session</span>
          )}
        </p>
      </div>

      <AvatarStack
        people={members}
        total={memberCount}
        max={3}
        size="sm"
        className="hidden sm:flex"
      />
      <ChevronRight
        className="size-4 shrink-0 text-faint-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
        aria-hidden="true"
      />
    </Link>
  )
}
