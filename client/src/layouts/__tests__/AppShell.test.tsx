import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'

/* The shell's job is the gate; the chrome inside it is not what these assert. */
vi.mock('@/layouts/Sidebar', () => ({ Sidebar: () => null }))
vi.mock('@/layouts/MobileChrome', () => ({ MobileHeader: () => null, MobileNav: () => null }))
vi.mock('@/components/CourseSearch', () => ({
  CourseSearchDialog: () => null,
  useCourseSearchShortcut: () => undefined,
}))

const mockAuth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))
vi.mock('@/state/AuthProvider', () => ({ useAuth: () => mockAuth.value }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/home" element={<p>Home screen</p>} />
        </Route>
        <Route path="/" element={<p>Landing screen</p>} />
        <Route path="/onboarding" element={<p>Onboarding screen</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell route guard', () => {
  it('shows a branded loading state instead of a blank screen while the session restores', () => {
    mockAuth.value = { status: 'loading', user: null }
    renderAt('/home')

    expect(screen.getByRole('status')).toHaveTextContent(/loading your study hub/i)
    expect(screen.queryByText('Home screen')).not.toBeInTheDocument()
  })

  it('redirects a signed-out visitor to the landing page', () => {
    mockAuth.value = { status: 'signedOut', user: null }
    renderAt('/home')

    expect(screen.getByText('Landing screen')).toBeInTheDocument()
  })

  it('sends a signed-in user who has not onboarded to onboarding', () => {
    mockAuth.value = { status: 'signedIn', user: { onboardingCompleted: false } }
    renderAt('/home')

    expect(screen.getByText('Onboarding screen')).toBeInTheDocument()
  })

  it('renders the route once the user is signed in and onboarded', () => {
    mockAuth.value = { status: 'signedIn', user: { onboardingCompleted: true } }
    renderAt('/home')

    expect(screen.getByText('Home screen')).toBeInTheDocument()
  })
})
