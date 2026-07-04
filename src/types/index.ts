export type ID = string

export type Status = 'active' | 'inactive' | 'pending' | 'archived' | 'cancelled'

export interface Timestamps {
  createdAt: string
  updatedAt: string
}

export interface BaseEntity extends Timestamps {
  id: ID
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export type SortOrder = 'asc' | 'desc'

export interface SortConfig {
  field: string
  order: SortOrder
}

export interface FilterConfig {
  field: string
  value: string | string[] | boolean | null
}
