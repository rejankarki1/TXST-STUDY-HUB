import * as React from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search, User } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Avatar } from '@/components/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddCourseDialog } from '@/components/AddCourseDialog'
import { courseHref } from '@/lib/courses'
import { cn, courseVars } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import { NAV_ITEMS } from './nav'

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
      ? 'border-primary-border bg-primary-subtle font-medium text-primary shadow-xs'
      : 'border-transparent text-muted-foreground hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-sunken hover:text-foreground hover:shadow-sm',
  )
}

/**
 * Desktop chrome: the five destinations, then My Courses as a flat jump list.
 *
 * The old sidebar nested joined groups under each course, which made the tree
 * the primary navigation. Courses are the primary object now, and everything
 * inside one lives behind its Course Hub tabs — so this is a list, not a tree.
 */
export function Sidebar({
  className,
  onOpenSearch,
}: {
  className?: string
  onOpenSearch: () => void
}) {
  const { user, myCourses, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'
  const [addOpen, setAddOpen] = React.useState(false)

  const name = user?.name ?? 'Student'

  return (
    <aside
      className={cn(
        'flex w-[272px] shrink-0 flex-col border-r border-border bg-surface/92 shadow-[1px_0_0_rgb(255_255_255_/_0.65)_inset]',
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 pl-5 pr-3">
        <Link to="/home" className="rounded-md" aria-label="TXST Study Hub — Home">
          <Wordmark />
        </Link>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-sunken px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">Search courses</span>
          <kbd className="rounded border border-border-strong bg-surface px-1.5 py-0.5 font-sans text-[10px] text-faint-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3 pt-3" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
          {myCourses.length === 0 ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mx-3 mt-1 rounded-lg border border-dashed border-border bg-surface-raised px-3 py-2 text-left text-[13px] text-muted-foreground shadow-xs transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
            >
              Add a course
            </button>
          ) : (
            myCourses.map((course) => (
              <div key={course.id} style={courseVars(course.code)}>
                <button
                  type="button"
                  onClick={() => navigate(courseHref(course))}
                  className={courseButtonClass(currentPath.startsWith(courseHref(course)))}
                  title={course.title}
                >
                  <span className="size-2 shrink-0 rounded-full bg-(--course)" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{course.code}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-border bg-surface-raised/70 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-surface-hover data-[state=open]:border-border data-[state=open]:bg-surface-hover">
            <Avatar person={{ name }} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user?.major ?? 'Texas State'}
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
                void signOut().then(() => navigate('/'))
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
