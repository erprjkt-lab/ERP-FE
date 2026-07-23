import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { apiRequest, ApiRequestError } from './client'

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
    useAuthStore.getState().clear()
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

  it('omits the Authorization header when there is no token', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ json: {} }))
    await apiRequest('/api/v1/me')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
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
