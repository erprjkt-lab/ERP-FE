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
