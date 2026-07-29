export type ApiPartyRole = 'customer' | 'supplier' | 'vendor'
export type ApiBusinessType = 'Individual' | 'Company'
export type ApiGstType =
  'Regular' | 'Composition' | 'Unregistered' | 'Consumer' | 'SEZ' | 'Overseas'
export type ApiBalanceType = 'Dr' | 'Cr'

export interface ApiParty {
  id: number
  party_code: string
  party_name: string
  business_type: ApiBusinessType | null
  role: ApiPartyRole
  contact_person: string | null
  mobile: string
  email: string | null
  website: string | null
  address: string | null
  country_id: number | null
  state_id: number | null
  city: string | null
  pincode: string | null
  gst_number: string | null
  gst_type: ApiGstType | null
  pan_number: string | null
  tan_number: string | null
  aadhaar_number: string | null
  credit_limit: number | null
  credit_days: number | null
  opening_balance: number | null
  balance_type: ApiBalanceType | null
  payment_terms: string | null
  bank_name: string | null
  branch_name: string | null
  account_holder_name: string | null
  account_number: string | null
  ifsc_code: string | null
  upi_id: string | null
  service_category: string | null
  remarks: string | null
  status: number
  created_at: string | null
  updated_at: string | null
}

export interface PartyPayload {
  party_code?: string
  party_name?: string
  contact_person?: string
  mobile?: string
  email?: string
  website?: string
  address?: string
  country_id?: number | null
  state_id?: number | null
  city?: string
  pincode?: string
  gst_number?: string
  gst_type?: ApiGstType
  pan_number?: string
  credit_limit?: number
  credit_days?: number
  opening_balance?: number
  payment_terms?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch_name?: string
  account_holder_name?: string
  upi_id?: string
  service_category?: string
  remarks?: string
  status?: number
}

export interface CreatePartyPayload extends PartyPayload {
  party_name: string
  mobile: string
}

export type UpdatePartyPayload = PartyPayload

// The party master endpoints predate the app's shared ApiEnvelope/PaginatedEnvelope
// convention (see src/types/api.ts) — they return Laravel's raw paginator/model JSON
// directly, with no {status, message, ...} wrapper.
export interface LaravelPaginator<T> {
  current_page: number
  data: T[]
  per_page: number
  total: number
  last_page: number
}
