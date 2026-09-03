import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'

const api = vi.hoisted(() => ({
  refreshSession: vi.fn(),
  login: vi.fn(),
  setAccessToken: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {},
  authApi: {
    login: api.login,
    signup: vi.fn(),
    logout: vi.fn(),
    updateMe: vi.fn(),
    me: vi.fn(),
  },
  coursesApi: {
    list: vi.fn().mockResolvedValue({ courses: [] }),
    create: vi.fn(),
    listDepartments: vi.fn(),
  },
  meApi: { addCourse: vi.fn(), removeCourse: vi.fn() },
  onSessionExpired: vi.fn(),
  onSessionRefreshed: vi.fn(),
  refreshSession: api.refreshSession,
  setAccessToken: api.setAccessToken,
}))

function AuthHarness() {
  const { status, user, signIn } = useAuth()
  return (
    <>
      <output>{`${status}:${user?.email ?? 'none'}`}</output>
      <button type="button" onClick={() => void signIn({ email: 'user@txstate.edu', password: 'Password!1' })}>
        Log in
      </button>
    </>
  )
}

describe('AuthProvider operation ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not let a stale boot refresh undo a successful login', async () => {
    let rejectRefresh!: (error: Error) => void
    api.refreshSession.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRefresh = reject
      }),
    )
    api.login.mockResolvedValue({
      accessToken: 'access-token',
      user: { email: 'user@txstate.edu', courses: [] },
    })

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('signedIn:user@txstate.edu')).toBeInTheDocument()

    await act(async () => rejectRefresh(new Error('No refresh cookie')))

    expect(screen.getByText('signedIn:user@txstate.edu')).toBeInTheDocument()
  })
})
