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

/** Query shared by the item-wise (flat) list endpoints. `status` is the header status,
 * except GRN items where it maps to `line_status`. */
export interface ItemListParams {
  page?: number
  perPage?: number
  status?: string | null
}
