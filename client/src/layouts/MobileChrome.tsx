import * as React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { NotificationBell } from '@/components/NotificationBell'
import { Avatar } from '@/components/Avatar'
import { Dialog, DialogTitle, SheetContent } from '@/components/ui/dialog'
import { courseSlug } from '@/lib/courses'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { useUnreadTotal } from '@/state/selectors'
import { NAV_ITEMS } from './Sidebar'

/* -------------------------------------------------------------------------
   Top header — brand, notifications, and the account sheet. Deliberately not
   a shrunken sidebar: on a phone the nav belongs under the thumb.
   ---------------------------------------------------------------------- */
export function MobileHeader({ className }: { className?: string }) {
  const { state, signOut } = useApp()
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const courseDetailsByCode = Object.fromEntries(
    state.profile.courseDetails.map((course) => [course.code, course]),
  )

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface pl-4 pr-2',
        className,
      )}
    >
      <Link to="/home" aria-label="TXST Study — Home">
        <Wordmark size="sm" />
      </Link>

      <div className="flex items-center gap-0.5">
        <NotificationBell />
        <Dialog open={open} onOpenChange={setOpen}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-1 rounded-full p-0.5"
            aria-label="Account and courses"
          >
            <Avatar person={{ name: state.profile.name }} size="sm" />
          </button>

          <SheetContent side="right" aria-describedby={undefined}>
            <DialogTitle className="sr-only">Account</DialogTitle>

            <div className="flex items-center gap-3 border-b border-border p-5">
              <Avatar person={{ name: state.profile.name }} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {state.profile.name}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {state.profile.major}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <h3 className="px-3 pb-1 pt-2 text-eyebrow text-faint-foreground">My courses</h3>
              {state.profile.courses.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => go(`/courses/${courseSlug(code)}`)}
                  className="block w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-sunken"
                >
                  <span className="block text-sm font-medium text-foreground">{code}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {courseDetailsByCode[code]?.title ?? code}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={() => go('/profile')}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-foreground-soft transition-colors hover:bg-surface-sunken"
              >
                <User className="size-4 text-muted-foreground" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  signOut()
                  navigate('/')
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger-subtle"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </SheetContent>
        </Dialog>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------
   Bottom tab bar — four destinations, thumb height, safe-area aware.
   ---------------------------------------------------------------------- */
export function MobileNav({ className }: { className?: string }) {
  const unread = useUnreadTotal()

  return (
    <nav
      className={cn(
        'safe-bottom shrink-0 border-t border-border bg-surface',
        className,
      )}
      aria-label="Main"
    >
      <div className="flex">
        {NAV_ITEMS.map(({ to, label, short, icon: Icon, showUnread }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon className={cn('size-[22px]', isActive && 'stroke-[2.2]')} aria-hidden="true" />
                  {showUnread && unread > 0 && (
                    <span className="absolute -right-1.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground ring-2 ring-surface">
                      {unread}
                    </span>
                  )}
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
