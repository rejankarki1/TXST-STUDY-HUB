import type * as React from 'react'
import { Navigate, Outlet, useLocation, useMatch } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader, MobileNav } from './MobileChrome'
import { useApp } from '@/state/AppState'
import { cn } from '@/lib/utils'

/**
 * The shell is a fixed-height flex frame: only <main> scrolls. That is what
 * lets the chat screen own its viewport (header pinned, transcript scrolling,
 * composer anchored) without any fixed positioning.
 */
export function AppShell() {
  const { state } = useApp()
  const location = useLocation()
  const inChat = Boolean(useMatch('/groups/:id/chat'))

  if (state.authLoading) return null
  if (!state.signedIn) return <Navigate to="/" replace />
  if (!state.onboarded) return <Navigate to="/onboarding" replace />

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,var(--background),#f7f4ef_62%,var(--background))]">
        {/* On mobile the chat takes the whole screen — its own header replaces this one. */}
        <MobileHeader className={cn('lg:hidden', inChat && 'hidden')} />

        <main
          key={location.pathname}
          className={cn(
            'min-h-0 flex-1',
            inChat ? 'overflow-hidden' : 'overflow-y-auto scroll-slim',
          )}
        >
          <Outlet />
        </main>

        <MobileNav className={cn('lg:hidden', inChat && 'hidden')} />
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
