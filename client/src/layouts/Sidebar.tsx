import type * as React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Calendar, Compass, Home, LogOut, Plus, User, Users } from 'lucide-react'
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
import { courseSlug } from '@/lib/courses'
import { cn } from '@/lib/utils'
import { useApp } from '@/state/AppState'
import { useUnreadTotal } from '@/state/selectors'

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

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-primary-subtle font-medium text-primary before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary'
      : 'text-foreground-soft hover:bg-surface-sunken hover:text-foreground',
  )
}

export function Sidebar({ className }: { className?: string }) {
  const { state, signOut } = useApp()
  const unread = useUnreadTotal()
  const navigate = useNavigate()
  const courseDetailsByCode = Object.fromEntries(
    state.profile.courseDetails.map((course) => [course.code, course]),
  )

  return (
    <aside
      className={cn(
        'flex w-[260px] shrink-0 flex-col border-r border-border bg-surface',
        className,
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between pl-5 pr-3">
        <Link to="/home" className="rounded-md" aria-label="TXST Study — Home">
          <Wordmark />
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pt-1" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, showUnread }) => (
          <NavLink key={to} to={to} className={navClass}>
            <Icon className="size-[18px] shrink-0" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {showUnread && unread > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-5 my-4 border-t border-border" />

      <div className="flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <h2 className="text-eyebrow text-faint-foreground">My courses</h2>
          <Link
            to="/discover"
            className="rounded p-0.5 text-faint-foreground transition-colors hover:text-primary"
            aria-label="Find groups in your courses"
          >
            <Plus className="size-3.5" />
          </Link>
        </div>

        <div className="flex flex-col gap-0.5 overflow-y-auto scroll-slim pb-2">
          {state.profile.courses.map((code) => (
            <NavLink
              key={code}
              to={`/courses/${courseSlug(code)}`}
              className={({ isActive }) =>
                cn(
                  'truncate rounded-md px-3 py-1.5 text-[13px] transition-colors',
                  isActive
                    ? 'bg-primary-subtle font-medium text-primary'
                    : 'text-muted-foreground hover:bg-surface-sunken hover:text-foreground',
                )
              }
              title={courseDetailsByCode[code]?.title ?? code}
            >
              {code}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-sunken data-[state=open]:bg-surface-sunken">
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
    </aside>
  )
}
