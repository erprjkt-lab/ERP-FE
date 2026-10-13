import { useAuthStore } from '@/store/authStore'

export class ApiRequestError extends Error {
  status: number
  fieldErrors?: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type QueryValue = string | number | boolean | undefined

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// Track concurrent 401s to prevent logout spam
let last401Time = 0
const LOGOUT_COOLDOWN = 1000 // Only logout once per second max

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options
  const authState = useAuthStore.getState()
  const token = authState.token

  // If no token and not a login request, redirect to login
  if (!token && !path.includes('/login')) {
    const now = Date.now()
    if (now - last401Time > LOGOUT_COOLDOWN) {
      last401Time = now
      authState.clear()
    }
    throw new ApiRequestError('Unauthenticated', 401)
  }

  // A FormData body goes out as-is: the browser has to set Content-Type itself
  // so it can add the multipart boundary. Setting it here would break the upload.
  const isFormData = body instanceof FormData

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false
  const payload: unknown = isJson ? await response.json() : undefined

  if (!response.ok) {
    const message =
      (isRecord(payload) && typeof payload.message === 'string' && payload.message) ||
      response.statusText ||
      'Request failed'
    const fieldErrors =
      isRecord(payload) && isRecord(payload.errors)
        ? (payload.errors as Record<string, string[]>)
        : undefined

    if (response.status === 401) {
      const now = Date.now()
      // Only clear auth once per LOGOUT_COOLDOWN to prevent spam logout
      if (now - last401Time > LOGOUT_COOLDOWN) {
        last401Time = now
        authState.clear()
      }
    }
    throw new ApiRequestError(message, response.status, fieldErrors)
  }

  return payload as T
}

// Laravel 422s put the useful detail in `errors` (e.g. "Insufficient stock
// balance for this item/location/batch/heat/serial combination.") while
// `message` is often just a generic "Validation failed" — surface the field
// errors when present so the user sees what's actually wrong.
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiRequestError && error.fieldErrors) {
    const messages = Object.values(error.fieldErrors).flat()
    if (messages.length > 0) return messages.join(' ')
  }
  if (error instanceof Error) return error.message
  return fallback
}

/** Resolves a file URL returned by ERP-BE against the API host.
 *
 * Storage URLs are built server-side as `env('APP_URL') . '/storage/...'`. When
 * APP_URL is unset there, the path comes back relative and the browser resolves
 * it against the frontend's own origin, where nothing is served. Anchoring it to
 * the API base URL is correct either way: an absolute URL is returned untouched.
 */
export function resolveFileUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}
