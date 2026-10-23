import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import {
  apiRequest,
  ApiRequestError,
  getErrorMessage,
  _reset401Cooldown,
  _resetThrottle,
} from './client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

function mockResponse({
  ok = true,
  status = 200,
  statusText = 'OK',
  json,
  isJson = true,
}: {
  ok?: boolean
  status?: number
  statusText?: string
  json?: unknown
  isJson?: boolean
}) {
  return {
    ok,
    status,
    statusText,
    headers: { get: () => (isJson ? 'application/json' : 'text/plain') },
    json: async () => json,
  } as unknown as Response
}

describe('apiRequest', () => {
  beforeEach(() => {
    _reset401Cooldown()
    useAuthStore.getState().setToken('test-token')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls fetch with the base URL + path', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: { data: 'ok' } }))
    await apiRequest('/api/v1/employees')
    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/api/v1/employees`, expect.any(Object))
  })

  it('appends query params to the URL', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: { data: [] } }))
    await apiRequest('/api/v1/employees', { query: { page: 2, per_page: 100 } })
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toBe(`${BASE_URL}/api/v1/employees?page=2&per_page=100`)
  })

  it('omits undefined query values', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: { data: [] } }))
    await apiRequest('/api/v1/employees', { query: { page: 1, status: undefined } })
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toBe(`${BASE_URL}/api/v1/employees?page=1`)
  })

  it('always sends an Accept header', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: {} }))
    await apiRequest('/api/v1/me')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Accept).toBe('application/json')
  })

  it('sets Content-Type and serializes the body when a body is given', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: {} }))
    await apiRequest('/api/v1/employees', { method: 'POST', body: { name: 'Jane' } })
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe(JSON.stringify({ name: 'Jane' }))
  })

  it('does not set Content-Type when there is no body', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: {} }))
    await apiRequest('/api/v1/employees')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined()
  })

  it('adds an Authorization header when a token is present', async () => {
    useAuthStore.getState().setToken('secret-token')
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: {} }))
    await apiRequest('/api/v1/me')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-token')
  })

  it('omits the Authorization header when there is no token on login endpoints', async () => {
    useAuthStore.getState().clear()
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: {} }))
    await apiRequest('/api/v1/auth/login')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('rejects unauthenticated requests to protected endpoints', async () => {
    useAuthStore.getState().clear()
    await expect(apiRequest('/api/v1/me')).rejects.toThrow('Unauthenticated')
  })

  it('returns the parsed JSON payload on success', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: { data: { id: 1 } } }))
    const result = await apiRequest('/api/v1/employees/1')
    expect(result).toEqual({ data: { id: 1 } })
  })

  it('returns undefined for a non-JSON (e.g. 204) response', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ isJson: false, status: 204 }))
    const result = await apiRequest('/api/v1/employees/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ApiRequestError with the server message on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ ok: false, status: 422, json: { message: 'Validation failed' } }),
    )
    await expect(apiRequest('/api/v1/employees', { method: 'POST', body: {} })).rejects.toThrow(
      'Validation failed',
    )
  })

  it('falls back to statusText when the payload has no message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ ok: false, status: 500, statusText: 'Internal Server Error', json: {} }),
    )
    await expect(apiRequest('/api/v1/employees')).rejects.toThrow('Internal Server Error')
  })

  it('attaches fieldErrors from a validation error payload', async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        ok: false,
        status: 422,
        json: { message: 'Validation failed', errors: { email: ['The email is required.'] } },
      }),
    )
    try {
      await apiRequest('/api/v1/employees', { method: 'POST', body: {} })
      expect.fail('expected apiRequest to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError)
      expect((error as ApiRequestError).fieldErrors).toEqual({
        email: ['The email is required.'],
      })
      expect((error as ApiRequestError).status).toBe(422)
    }
  })

  it('clears the auth store on a 401 response', async () => {
    useAuthStore.getState().setToken('stale-token')
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ ok: false, status: 401, json: { message: 'Unauthenticated' } }),
    )
    await expect(apiRequest('/api/v1/me')).rejects.toThrow('Unauthenticated')
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('does not clear the auth store on non-401 errors', async () => {
    useAuthStore.getState().setToken('valid-token')
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ ok: false, status: 404, json: { message: 'Not found' } }),
    )
    await expect(apiRequest('/api/v1/employees/999')).rejects.toThrow('Not found')
    expect(useAuthStore.getState().token).toBe('valid-token')
  })
})

describe('getErrorMessage', () => {
  it('prefers field errors over the generic top-level message', () => {
    const error = new ApiRequestError('Validation failed', 422, {
      qty: ['Insufficient stock balance for this item/location/batch/heat/serial combination.'],
    })
    expect(getErrorMessage(error)).toBe(
      'Insufficient stock balance for this item/location/batch/heat/serial combination.',
    )
  })

  it('joins messages when several fields failed', () => {
    const error = new ApiRequestError('Validation failed', 422, {
      issued_qty: ['The issued qty must be greater than 0.'],
      store_location_id: ['The selected store location is invalid.'],
    })
    expect(getErrorMessage(error)).toBe(
      'The issued qty must be greater than 0. The selected store location is invalid.',
    )
  })

  it('uses the top-level message when there are no field errors', () => {
    expect(getErrorMessage(new ApiRequestError('Not found', 404))).toBe('Not found')
    expect(getErrorMessage(new Error('Network request failed'))).toBe('Network request failed')
  })

  it('falls back for non-Error throwables, honouring a custom fallback', () => {
    expect(getErrorMessage('a string')).toBe('Something went wrong')
    expect(getErrorMessage(undefined, 'Login failed')).toBe('Login failed')
  })
})

describe('request throttling', () => {
  beforeEach(() => {
    _reset401Cooldown()
    _resetThrottle()
    useAuthStore.setState({ token: 'test-token' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('never has more than 4 requests in flight at once', async () => {
    let inFlight = 0
    let peak = 0
    const release: Array<() => void> = []

    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        return new Promise<Response>(resolve => {
          release.push(() => {
            inFlight -= 1
            resolve(mockResponse({ json: { data: null } }))
          })
        })
      }),
    )

    const requests = Array.from({ length: 12 }, () => apiRequest('/ping'))
    // Drain the queue a slot at a time; each release lets a waiter through.
    for (let i = 0; i < 12; i += 1) {
      await vi.waitFor(() => expect(release.length).toBeGreaterThan(i))
      release[i]()
    }
    await Promise.all(requests)

    expect(peak).toBe(4)
  })

  it('parks every in-flight request on a 429 instead of retrying each one', async () => {
    const rateLimited = {
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: { get: (key: string) => (key === 'Retry-After' ? '0.01' : 'application/json') },
      json: async () => ({ message: 'Too Many Requests' }),
    } as unknown as Response

    let calls = 0
    const started: number[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1
        started.push(Date.now())
        // Only the very first request is rate limited; the cooldown it sets
        // must still delay the one queued behind it.
        return calls === 1 ? rateLimited : mockResponse({ json: { data: null } })
      }),
    )

    const first = apiRequest('/a')
    const second = apiRequest('/b')
    await Promise.all([first, second])

    // 2 requests + 1 retry of the rate-limited one, not 2 x 3 independent retries.
    expect(calls).toBe(3)
    expect(started[started.length - 1] - started[0]).toBeGreaterThanOrEqual(10)
  })
})
