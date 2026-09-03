import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, refreshSession, setAccessToken } from './client'

const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const fail = (status: number, message = 'nope', extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ success: false, message, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const session = {
  accessToken: 'fresh-token',
  user: { id: 'u1', email: 'demo@txstate.edu' },
}

describe('apiRequest', () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    setAccessToken(null)
  })

  it('unwraps the data envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(ok({ courses: [] }))))
    await expect(apiRequest('/courses')).resolves.toEqual({ courses: [] })
  })

  it('throws ApiError carrying the status and field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        fail(400, 'Invalid signup data', { errors: { email: ['Use your @txstate.edu email'] } }),
      ),
    )

    const error: unknown = await apiRequest('/auth/signup', { method: 'POST' }).catch(
      (e: unknown) => e,
    )

    /* A guard, not expect().toBeInstanceOf() — this one narrows `unknown` for the
       property assertions below, and still fails the test when the type is wrong. */
    if (!(error instanceof ApiError)) throw new Error(`expected ApiError, got ${String(error)}`)

    expect(error.status).toBe(400)
    expect(error.fieldError('email')).toBe('Use your @txstate.edu email')
  })

  it('sends the bearer token when one is set', async () => {
    setAccessToken('token-abc')
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(ok({ user: {} })))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/auth/me')

    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token-abc')
  })

  it('omits the token for endpoints marked auth:false', async () => {
    setAccessToken('token-abc')
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(ok({ courses: [] })))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/courses', { auth: false })

    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBeNull()
  })

  /* The behaviour the old client was missing entirely: an expired access token
     used to make every call fail until a full page reload. */
  it('refreshes once and retries once after a 401', async () => {
    setAccessToken('expired-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fail(401, 'Invalid or expired token'))
      .mockResolvedValueOnce(ok(session))
      .mockResolvedValueOnce(ok({ sessions: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/sessions/mine')).resolves.toEqual({ sessions: [] })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh')

    /* The retry must carry the *new* token, not the expired one. */
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Headers
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token')
  })

  it('does not loop when the retry also 401s', async () => {
    setAccessToken('expired-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fail(401))
      .mockResolvedValueOnce(ok(session))
      .mockResolvedValueOnce(fail(401, 'Still unauthorized'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/sessions/mine')).rejects.toThrow('Still unauthorized')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('gives up without retrying when there is no token to refresh', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(fail(401, 'Authentication required')))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/sessions/mine')).rejects.toThrow('Authentication required')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces a non-JSON response as an ApiError rather than crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>502</html>', { status: 502 })),
    )

    await expect(apiRequest('/courses')).rejects.toThrow('Unexpected server response')
  })
})

describe('refreshSession single-flight', () => {
  beforeEach(() => {
    setAccessToken(null)
    vi.restoreAllMocks()
  })

  /* React StrictMode double-invokes the boot effect. Without this guarantee both
     calls rotate the same refresh cookie and the loser is signed out. */
  it('collapses concurrent callers into one network rotation', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(ok(session)), 10)),
    )
    vi.stubGlobal('fetch', fetchMock)

    const [a, b, c] = await Promise.all([refreshSession(), refreshSession(), refreshSession()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a.accessToken).toBe('fresh-token')
    expect(b).toBe(a)
    expect(c).toBe(a)
  })

  it('allows a fresh rotation after the previous one settles', async () => {
    /* A Response body can only be read once, so each call needs a fresh one. */
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(ok(session)))
    vi.stubGlobal('fetch', fetchMock)

    await refreshSession()
    await refreshSession()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('clears the in-flight promise when refresh fails, so a later retry can work', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fail(401, 'Invalid refresh token'))
      .mockResolvedValueOnce(ok(session))
    vi.stubGlobal('fetch', fetchMock)

    await expect(refreshSession()).rejects.toThrow('Invalid refresh token')
    await expect(refreshSession()).resolves.toMatchObject({ accessToken: 'fresh-token' })
  })
})
