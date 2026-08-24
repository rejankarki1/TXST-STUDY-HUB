import * as React from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Compass, Home, LogOut, Plus, User, Users } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { NotificationBell } from '@/components/NotificationBell'
import { Avatar } from '@/components/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { courseHref } from '@/lib/courses'
import { cn, courseVars, useStickyState } from '@/lib/utils'
import { AddCourseDialog } from '@/components/AddCourseDialog'
import { useApp } from '@/state/AppState'
import { useMyCourseGroups } from '@/state/selectors'

export type NavItem = {
  to: string
  label: string
  /** Shorter label for the mobile tab bar. */
  short?: string
  icon: React.ComponentType<{ className?: string }>
  showUnread?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/my-groups', label: 'My Groups', short: 'Groups', icon: Users, showUnread: true },
  { to: '/sessions', label: 'Sessions', icon: Calendar },
]

/**
 * Desktop drops the My Groups tab: every joined group is one click away in the
 * course tree below, so a second flat list of the same groups is noise. The
 * /my-groups route and the mobile tab both stay.
 */
export const DESKTOP_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== '/my-groups')

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-[background-color,color,box-shadow] duration-150',
    isActive
      ? 'bg-primary-subtle font-medium text-primary shadow-xs before:absolute before:-left-3 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary'
      : 'text-foreground-soft hover:bg-surface-hover hover:text-foreground',
  )
}

function courseButtonClass(active: boolean) {
  return cn(
    'group flex w-full cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-[13px] transition-[transform,border-color,background-color,color,box-shadow] duration-150 active:translate-y-0 active:shadow-xs',
    active
      ? 'border-primary-border bg-primary-subtle font-medium text-primary shadow-xs hover:border-primary-border hover:bg-primary-subtle'
      : 'border-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-sunken hover:text-foreground hover:shadow-sm',
  )
}

/** A joined group, indented under its course. The rule makes the nesting read
 *  as containment rather than as a second flat list. */
function groupClass({ isActive }: { isActive: boolean }) {
  return cn(
    'ml-3 truncate border-l border-border py-1.5 pl-4 pr-3 text-[13px] transition-colors',
    isActive
      ? 'border-primary font-medium text-primary'
      : 'text-muted-foreground hover:border-border-strong hover:bg-surface-hover/70 hover:text-foreground',
  )
}

export function Sidebar({ className }: { className?: string }) {
  const { state, signOut, addCourse } = useApp()
  const { courses, orphans } = useMyCourseGroups()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'
  const nothingYet = courses.length === 0 && orphans.length === 0
  const [addOpen, setAddOpen] = React.useState(false)

  /* Collapsed rather than expanded is what we persist, so a course added later
     shows its groups by default instead of silently arriving folded shut. */
  const [collapsed, setCollapsed] = useStickyState<string[]>('txst:sidebar:collapsed', [])

  const isOpen = (courseId: string) => !collapsed.includes(courseId)

  const toggle = (courseId: string) =>
    setCollapsed((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    )

  return (
    <aside
      className={cn(
        'flex w-[272px] shrink-0 flex-col border-r border-border bg-surface/92 shadow-[1px_0_0_rgb(255_255_255_/_0.65)_inset]',
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 pl-5 pr-3">
        <Link to="/home" className="rounded-md" aria-label="TXST Study — Home">
          <Wordmark />
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex flex-col gap-1 px-3 pt-3" aria-label="Main">
        {DESKTOP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navClass}>
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mx-5 my-4 border-t border-border" />

      <div className="flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <h2 className="text-eyebrow text-faint-foreground">My courses</h2>
          {/* A button, not a link: adding a course must not cost you the page
              you are on. Native <button> keeps Enter/Space and focus order. */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg p-1 text-faint-foreground transition-colors hover:bg-primary-subtle hover:text-primary"
            aria-label="Add a course"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 overflow-y-auto scroll-slim pb-2">
          {nothingYet ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mx-3 mt-1 rounded-lg border border-dashed border-border bg-surface-raised px-3 py-2 text-left text-[13px] text-muted-foreground shadow-xs transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
            >
              Add a course
            </button>
          ) : null}

          {courses.map(({ course, groups }) => {
            const open = isOpen(course.id)
            const hasGroups = groups.length > 0
            const groupListId = `sidebar-course-${course.id}-groups`
            const active = currentPath === courseHref(course)
            return (
              <div key={course.id} className="flex flex-col">
                <div style={courseVars(course.code)}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasGroups) toggle(course.id)
                      navigate(courseHref(course))
                    }}
                    aria-expanded={hasGroups ? open : undefined}
                    aria-controls={hasGroups ? groupListId : undefined}
                    className={courseButtonClass(active)}
                    title={course.title}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full bg-(--course)"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{course.code}</span>
                    {hasGroups ? (
                      <ChevronRight
                        className={cn(
                          'size-3.5 shrink-0 text-faint-foreground transition-transform duration-150',
                          open && 'rotate-90',
                          active && 'text-primary',
                        )}
                        aria-hidden="true"
                      />
                    ) : (
                      <ChevronRight
                        className="size-3.5 shrink-0 text-faint-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
                {/* No gap between rows: the left rule has to read as one
                    continuous line of containment, not a dashed stack. */}
                {open && groups.length > 0 && (
                  <div id={groupListId} className="flex flex-col">
                    {groups.map((group) => (
                      <NavLink
                        key={group.id}
                        to={`/groups/${group.id}`}
                        className={groupClass}
                        title={group.name}
                      >
                        {group.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {orphans.length > 0 && (
            <>
              <h2 className="px-3 pb-1 pt-4 text-eyebrow text-faint-foreground">
                Groups outside My Courses
              </h2>
              {/* Groups whose course you removed. Each bucket carries the fix:
                  add the course back and it rejoins the tree above. */}
              {orphans.map((bucket) => (
                <div key={bucket.course?.id ?? bucket.courseCode} className="flex flex-col">
                  <div className="flex items-center gap-1 pr-1">
                    <span className="flex-1 truncate px-3 py-1.5 text-[13px] text-muted-foreground">
                      {bucket.courseCode}
                    </span>
                    {bucket.course && (
                      <button
                        type="button"
                        onClick={() => void addCourse(bucket.course!.id)}
                        className="rounded-lg p-1 text-faint-foreground transition-colors hover:bg-primary-subtle hover:text-primary"
                        aria-label={`Add ${bucket.courseCode} to My Courses`}
                        title={`Add ${bucket.courseCode} to My Courses`}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col">
                    {bucket.groups.map((group) => (
                      <NavLink
                        key={group.id}
                        to={`/groups/${group.id}`}
                        className={groupClass}
                        title={group.name}
                      >
                        {group.name}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-border bg-surface-raised/70 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-surface-hover data-[state=open]:border-border data-[state=open]:bg-surface-hover">
            <Avatar person={{ name: state.profile.name }} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {state.profile.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {state.profile.major}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-[236px]">
            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                signOut()
                navigate('/')
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddCourseDialog open={addOpen} onOpenChange={setAddOpen} />
    </aside>
  )
}
