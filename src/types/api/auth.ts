import type { ApiEmployee } from '@/types/api/hr'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  token_type: string
  employee: ApiEmployee
}

export type AuthUser = ApiEmployee
