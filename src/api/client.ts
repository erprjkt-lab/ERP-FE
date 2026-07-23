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
  const token = useAuthStore.getState().token

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
      useAuthStore.getState().clear()
    }
    throw new ApiRequestError(message, response.status, fieldErrors)
  }

  return payload as T
}
