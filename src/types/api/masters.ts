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

// Item-master/category/uom/material-grade endpoints (added in ERP-BE commit a5190aa)
// DO go through the shared ApiEnvelope/PaginatedEnvelope convention, unlike party
// master above — see src/types/api.ts.

export interface ApiUom {
  id: number
  name: string
  code: string
  status: number
}

export interface ApiItemCategory {
  id: number
  name: string
  code: string | null
  parent_id: number | null
  is_final: boolean
  status: number
}

export interface ApiMaterialGrade {
  id: number
  material_grade: string
  material_type: string | null
  standard: string | null
  specification: string | null
  status: number
}

// Backing table `item_master` is one shared table with an `item_type` discriminator
// (1=Finished Goods, 2=Raw Material, 3=Consumables, 4=Machine, 5=Gauge & Instrument,
// 6=Packing Material) — ItemResource always returns the full column union regardless
// of type, so this single interface covers all 6 `/api/v1/<plural>` endpoints.
export interface ApiItemMaster {
  id: number
  item_type: number
  item_code: string
  item_name: string
  category_id: number | null
  brand: string | null
  uom_id: number | null
  alternate_uom_id: number | null
  hsn_code: string | null
  gst_percent: number | null
  description: string | null
  image: string | null
  price: number | null
  status: number
  created_at: string | null
  updated_at: string | null
  // Finished Good fields
  party_id: number | null
  customer_part_no: string | null
  drawing_no: string | null
  drawing_revision: string | null
  drawing_file: string | null
  material_grade: number | null
  weight: number | null
  // Raw Material fields
  material_type: string | null
  shape: string | null
  diameter: number | null
  width: number | null
  thickness: number | null
  length: number | null
  density: number | null
  color: string | null
  // Machine fields
  machine_make: string | null
  model: string | null
  serial_number: string | null
  capacity: string | null
  power_rating: string | null
  installation_date: string | null
  purchase_date: string | null
  warranty_expiry: string | null
  amc_expiry: string | null
  maintenance_interval: string | null
  machine_location: string | null
  // Gauge & Instrument fields
  gauge_type: string | null
  instrument_range: string | null
  accuracy: string | null
  least_count: string | null
  calibration_frequency: string | null
  calibration_due_date: string | null
  certificate_number: string | null
  manufacturer: string | null
}

// One loose payload type reused for create/update across all 6 item endpoints —
// each backend controller validates its own subset, so over-including fields for
// a given type is harmless (the backend ignores columns it doesn't validate).
// `image` is deliberately omitted: item_master.image is a plain string(255) column
// with no real upload endpoint, so images stay local-only on the frontend for now.
export interface ItemMasterPayload {
  item_code?: string
  item_name?: string
  category_id?: number | null
  brand?: string
  uom_id?: number | null
  alternate_uom_id?: number | null
  hsn_code?: string
  gst_percent?: number
  description?: string
  price?: number
  status?: number
  party_id?: number | null
  customer_part_no?: string
  drawing_no?: string
  drawing_revision?: string
  drawing_file?: string
  material_grade?: number | null
  weight?: number
  material_type?: string
  shape?: string
  diameter?: number
  width?: number
  thickness?: number
  length?: number
  density?: number
  color?: string
  machine_make?: string
  model?: string
  serial_number?: string
  capacity?: string
  power_rating?: string
  installation_date?: string
  purchase_date?: string
  warranty_expiry?: string
  amc_expiry?: string
  maintenance_interval?: string
  machine_location?: string
  gauge_type?: string
  instrument_range?: string
  accuracy?: string
  least_count?: string
  calibration_frequency?: string
  calibration_due_date?: string
  certificate_number?: string
  manufacturer?: string
}
