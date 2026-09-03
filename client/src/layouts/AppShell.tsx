import * as React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader, MobileNav } from './MobileChrome'
import { CourseSearchDialog, useCourseSearchShortcut } from '@/components/CourseSearch'
import { Wordmark } from '@/components/Wordmark'
import { useAuth } from '@/state/AuthProvider'
import { cn } from '@/lib/utils'

/**
 * The shell is a fixed-height flex frame: only <main> scrolls. Course search is
 * owned here rather than in the sidebar so the same dialog serves the desktop
 * header, the mobile header, and the Cmd-K shortcut.
 */
export function AppShell() {
  const { status, user } = useAuth()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = React.useState(false)

  const openSearch = React.useCallback(() => setSearchOpen(true), [])
  useCourseSearchShortcut(openSearch)

  if (status === 'loading') return <BrandedSplash />
  if (status === 'signedOut') return <Navigate to="/" replace />
  if (!user?.onboardingCompleted) return <Navigate to="/onboarding" replace />

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar className="hidden lg:flex" onOpenSearch={openSearch} />

      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,var(--background),#f7f4ef_62%,var(--background))]">
        <MobileHeader className="lg:hidden" onOpenSearch={openSearch} />

        <main key={location.pathname} className="min-h-0 flex-1 overflow-y-auto scroll-slim">
          <Outlet />
        </main>

        <MobileNav className="lg:hidden" />
      </div>

      <CourseSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

/**
 * Shown while the refresh cookie is being exchanged on boot. A blank screen here
 * reads as a broken app; this reads as loading.
 */
export function BrandedSplash() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background">
      <Wordmark size="lg" />
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-[13px] text-muted-foreground"
      >
        <span className="size-3.5 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
        Loading your study hub…
      </div>
    </div>
  )
}

/** Standard page frame: max width, generous gutters, consistent rhythm. */
export function Page({
  children,
  className,
  width = 'default',
}: {
  children: React.ReactNode
  className?: string
  width?: 'default' | 'wide' | 'narrow'
}) {
  const max = {
    narrow: 'max-w-2xl',
    default: 'max-w-[1180px]',
    wide: 'max-w-[1320px]',
  }[width]

  return (
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8', max, className)}>
      {children}
    </div>
  )
}
