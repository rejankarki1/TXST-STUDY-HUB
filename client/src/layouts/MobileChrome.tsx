import * as React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search, User } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Avatar } from '@/components/Avatar'
import { AddCourseDialog } from '@/components/AddCourseDialog'
import { Dialog, DialogTitle, SheetContent } from '@/components/ui/dialog'
import { courseHref } from '@/lib/courses'
import { cn, courseVars } from '@/lib/utils'
import { useAuth } from '@/state/AuthProvider'
import { NAV_ITEMS } from './nav'

/* -------------------------------------------------------------------------
   Top header — brand, course search, and the account sheet. Deliberately not
   a shrunken sidebar: on a phone the nav belongs under the thumb.
   ---------------------------------------------------------------------- */
export function MobileHeader({
  className,
  onOpenSearch,
}: {
  className?: string
  onOpenSearch: () => void
}) {
  const { user, myCourses, signOut } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [addOpen, setAddOpen] = React.useState(false)
  const navigate = useNavigate()

  const name = user?.name ?? 'Student'

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/95 pl-4 pr-2 shadow-xs backdrop-blur',
        className,
      )}
    >
      <Link to="/home" aria-label="TXST Study Hub — Home">
        <Wordmark size="sm" />
      </Link>

      <div className="flex items-center gap-0.5">
        {/* The desktop header's ⌘K, reachable on touch. */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Search courses"
        >
          <Search className="size-5" />
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-surface-hover"
            aria-label="Account and courses"
          >
            <Avatar person={{ name }} size="sm" />
          </button>

          <SheetContent side="right" aria-describedby={undefined}>
            <DialogTitle className="sr-only">Account</DialogTitle>

            <div className="flex items-center gap-3 border-b border-border p-5">
              <Avatar person={{ name }} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {user?.major ?? 'Texas State'}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="flex items-center justify-between px-3 pb-1 pt-2">
                <h3 className="text-eyebrow text-faint-foreground">My courses</h3>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setAddOpen(true)
                  }}
                  className="rounded-lg p-1 text-faint-foreground transition-colors hover:bg-primary-subtle hover:text-primary"
                  aria-label="Add a course"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {myCourses.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-muted-foreground">
                  No courses yet. Add one to get started.
                </p>
              ) : (
                myCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => go(courseHref(course))}
                    style={courseVars(course.code)}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full bg-(--course)"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {course.code}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {course.title}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={() => go('/profile')}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground-soft transition-colors hover:bg-surface-hover"
              >
                <User className="size-4 text-muted-foreground" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  void signOut().then(() => navigate('/'))
                }}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger-subtle"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </SheetContent>
        </Dialog>
      </div>

      <AddCourseDialog open={addOpen} onOpenChange={setAddOpen} />
    </header>
  )
}

/* -------------------------------------------------------------------------
   Bottom tab bar — the same five destinations as the sidebar, thumb height,
   safe-area aware.
   ---------------------------------------------------------------------- */
export function MobileNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'safe-bottom shrink-0 border-t border-border bg-surface/95 shadow-[0_-1px_8px_rgb(28_26_25_/_0.04)] backdrop-blur',
        className,
      )}
      aria-label="Main"
    >
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, short, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[58px] flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-xl transition-colors',
                    isActive && 'bg-primary-subtle',
                  )}
                >
                  <Icon
                    className={cn('size-[21px]', isActive && 'stroke-[2.2]')}
                    aria-hidden="true"
                  />
                </span>
                {short ?? label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
