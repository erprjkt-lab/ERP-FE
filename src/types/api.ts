export interface ApiEnvelope<T> {
  status: string
  message: string
  data: T
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface PaginatedEnvelope<T> {
  status: string
  message: string
  data: T[]
  meta: PaginationMeta
}
