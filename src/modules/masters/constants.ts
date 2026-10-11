import type { ApiUom } from '@/types/api/masters'

// Placeholder business values, same as HR's original BRANCH_OPTIONS/ROLE_OPTIONS —
// easy to edit once real business rules are confirmed.
export const CUSTOMER_TYPE_OPTIONS = [
  { label: 'Retail', value: 'retail' },
  { label: 'Wholesale', value: 'wholesale' },
  { label: 'Distributor', value: 'distributor' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Government', value: 'government' },
]

export const VENDOR_TYPE_OPTIONS = [
  { label: 'Service Provider', value: 'service' },
  { label: 'Contractor', value: 'contractor' },
  { label: 'Consultant', value: 'consultant' },
  { label: 'Transporter', value: 'transporter' },
  { label: 'Other', value: 'other' },
]

export const GST_TYPE_OPTIONS = [
  { label: 'Regular', value: 'regular' },
  { label: 'Composition', value: 'composition' },
  { label: 'Unregistered', value: 'unregistered' },
  { label: 'SEZ', value: 'sez' },
  { label: 'Consumer', value: 'consumer' },
]

export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Due on Receipt', value: 'due_on_receipt' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 45', value: 'net_45' },
  { label: 'Net 60', value: 'net_60' },
  { label: 'Advance', value: 'advance' },
]

export const MASTER_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

// Lightweight, optional-field format validators (Indian formats). Used as `pattern`
// rules with no accompanying `required`, so blank fields never fail validation.
export const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z][A-Z\d]$/i
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/i
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/i
export const PINCODE_REGEX = /^\d{6}$/
export const MOBILE_REGEX = /^[6-9]\d{9}$/

// Default country pre-selected on new Customer/Vendor/Supplier records —
// nearly all of this ERP's parties are domestic. Matched by name against the
// fetched country list rather than a hardcoded id, since that id is BE data.
export const DEFAULT_COUNTRY_NAME = 'India'

// ponytail: mirrors ERP-BE database/seeders/UomSeeder.php (fixed ids) so saves work
// even before /api/v1/uom-master returns rows; delete once the server DB is seeded.
export const FALLBACK_UOMS: ApiUom[] = [
  { id: 1, name: 'Numbers', code: 'NOS', status: 1 },
  { id: 2, name: 'Kilogram', code: 'KG', status: 1 },
  { id: 3, name: 'Gram', code: 'GM', status: 1 },
  { id: 4, name: 'Meter', code: 'MTR', status: 1 },
  { id: 5, name: 'Litre', code: 'LTR', status: 1 },
  { id: 6, name: 'Box', code: 'BOX', status: 1 },
  { id: 7, name: 'Dozen', code: 'DZN', status: 1 },
  { id: 8, name: 'Set', code: 'SET', status: 1 },
  { id: 9, name: 'Piece', code: 'PCS', status: 1 },
  { id: 10, name: 'Roll', code: 'ROLL', status: 1 },
  { id: 11, name: 'Milligram', code: 'MG', status: 1 },
  { id: 12, name: 'Tonne', code: 'TON', status: 1 },
  { id: 13, name: 'Quintal', code: 'QTL', status: 1 },
  { id: 14, name: 'Centimeter', code: 'CM', status: 1 },
  { id: 15, name: 'Millimeter', code: 'MM', status: 1 },
  { id: 16, name: 'Kilometer', code: 'KM', status: 1 },
  { id: 17, name: 'Inch', code: 'IN', status: 1 },
  { id: 18, name: 'Foot', code: 'FT', status: 1 },
  { id: 19, name: 'Yard', code: 'YD', status: 1 },
  { id: 20, name: 'Millilitre', code: 'ML', status: 1 },
  { id: 21, name: 'Kilolitre', code: 'KL', status: 1 },
  { id: 22, name: 'Gallon', code: 'GAL', status: 1 },
  { id: 23, name: 'Square Meter', code: 'SQM', status: 1 },
  { id: 24, name: 'Square Feet', code: 'SQFT', status: 1 },
  { id: 25, name: 'Cubic Meter', code: 'CBM', status: 1 },
  { id: 26, name: 'Cubic Feet', code: 'CFT', status: 1 },
  { id: 27, name: 'Pair', code: 'PAIR', status: 1 },
  { id: 28, name: 'Pack', code: 'PACK', status: 1 },
  { id: 29, name: 'Bundle', code: 'BDL', status: 1 },
  { id: 30, name: 'Coil', code: 'COIL', status: 1 },
  { id: 31, name: 'Sheet', code: 'SHT', status: 1 },
  { id: 32, name: 'Bag', code: 'BAG', status: 1 },
  { id: 33, name: 'Drum', code: 'DRUM', status: 1 },
  { id: 34, name: 'Can', code: 'CAN', status: 1 },
  { id: 35, name: 'Bottle', code: 'BTL', status: 1 },
  { id: 36, name: 'Carton', code: 'CTN', status: 1 },
  { id: 37, name: 'Pallet', code: 'PLT', status: 1 },
  { id: 38, name: 'Reel', code: 'REEL', status: 1 },
  { id: 39, name: 'Hour', code: 'HR', status: 1 },
  { id: 40, name: 'Day', code: 'DAY', status: 1 },
  { id: 41, name: 'Percent', code: 'PCT', status: 1 },
  { id: 42, name: 'Unit', code: 'UNIT', status: 1 },
]
