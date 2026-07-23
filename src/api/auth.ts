import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { AuthUser, LoginPayload, LoginResult } from '@/types/api/auth'

export function login(payload: LoginPayload): Promise<ApiEnvelope<LoginResult>> {
  return apiRequest('/api/v1/login', { method: 'POST', body: payload })
}

export function me(): Promise<ApiEnvelope<AuthUser>> {
  return apiRequest('/api/v1/me')
}

export function logout(): Promise<void> {
  return apiRequest('/api/v1/logout', { method: 'POST' })
}
