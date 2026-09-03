import type { AuthPayload } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

type ApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[] | undefined>
}

/** Carries status and body through, so callers can react to a specific failure
 *  (e.g. adopting the existing course a 409 hands back) instead of only a string. */
export class ApiError extends Error {
  /* Explicit fields, not constructor parameter properties: this project builds
     with erasableSyntaxOnly. */
  status: number
  data?: unknown
  errors?: Record<string, string[] | undefined>

  constructor(
    message: string,
    status: number,
    data?: unknown,
    errors?: Record<string, string[] | undefined>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.errors = errors
  }

  /** The first field-level message, for forms that show errors inline. */
  fieldError(field: string) {
    return this.errors?.[field]?.[0]
  }
}

/* -------------------------------------------------------------------- session

   The access token lives in this module rather than in React state so that the
   fetch layer can refresh and retry without a component in the loop. AuthProvider
   registers the two callbacks below and stays the single source of truth for
   what the *UI* renders.
   ------------------------------------------------------------------------- */

let accessToken: string | null = null
let onSession: ((payload: AuthPayload) => void) | null = null
let onSessionEnded: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function onSessionRefreshed(handler: (payload: AuthPayload) => void) {
  onSession = handler
}

export function onSessionExpired(handler: () => void) {
  onSessionEnded = handler
}

/**
 * One refresh at a time, ever.
 *
 * Two things used to race here: React StrictMode double-invoking the boot
 * effect, and any two concurrent requests both getting a 401. Both would rotate
 * the same refresh cookie twice, and the loser was signed out. Sharing a single
 * in-flight promise means every caller awaits the same rotation.
 */
let refreshInFlight: Promise<AuthPayload> | null = null

export function refreshSession(): Promise<AuthPayload> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    const payload = (await response.json().catch(() => ({
      success: false,
      message: 'Unexpected server response',
    }))) as ApiResponse<AuthPayload>

    if (!response.ok || !payload.success || !payload.data) {
      throw new ApiError(payload.message ?? 'Session expired', response.status)
    }

    accessToken = payload.data.accessToken
    onSession?.(payload.data)

    return payload.data
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

type RequestOptions = RequestInit & {
  /** Set false for the handful of endpoints that are readable signed out. */
  auth?: boolean
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' })
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options)

  /* An access token lasts 15 minutes, so a long session will hit exactly one
     401 and then work again. Refresh once, retry once — never a loop, because
     the retry does not consult this branch again. */
  if (response.status === 401 && options.auth !== false && accessToken) {
    try {
      await refreshSession()
      response = await send(path, options)
    } catch {
      accessToken = null
      onSessionEnded?.()
    }
  }

  const payload = (await response.json().catch(() => ({
    success: false,
    message: 'Unexpected server response',
  }))) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.message ?? 'Request failed',
      response.status,
      payload.data,
      payload.errors,
    )
  }

  if (payload.data === undefined) {
    throw new ApiError('Response data missing', response.status)
  }

  return payload.data
}

export function get<T>(path: string, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: 'GET' })
}

export function post<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  return apiRequest<T>(path, {
    ...options,
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export function patch<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  return apiRequest<T>(path, {
    ...options,
    method: 'PATCH',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export function put<T>(path: string, body?: unknown, options: RequestOptions = {}) {
  return apiRequest<T>(path, {
    ...options,
    method: 'PUT',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

export function del<T>(path: string, options: RequestOptions = {}) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}

/** Builds `?a=1&b=2`, dropping anything empty. */
export function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === false) continue
    search.set(key, String(value))
  }

  const encoded = search.toString()
  return encoded ? `?${encoded}` : ''
}

export { API_URL }
