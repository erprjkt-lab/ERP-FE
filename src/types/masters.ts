import type { BaseEntity, ID, Status } from './index'

export type CustomerType = 'retail' | 'wholesale' | 'distributor' | 'corporate' | 'government'
export type GstType = 'regular' | 'composition' | 'unregistered' | 'sez' | 'consumer'
export type VendorType = 'service' | 'contractor' | 'consultant' | 'transporter' | 'other'

export interface Customer extends BaseEntity {
  code: string
  name: string
  customerType: CustomerType | null
  status: Status
  contactPerson: string
  mobile: string
  email: string
  website?: string
  address: string
  countryId: ID | null
  countryName?: string
  stateId: ID | null
  stateName?: string
  cityId: ID | null
  cityName?: string
  pincode: string
  gstNumber?: string
  panNumber?: string
  gstType: GstType | null
  creditLimit: number
  creditDays: number
  openingBalance: number
  paymentTerms: string | null
  bankName?: string
  bankBranch?: string
  accountHolder?: string
  accountNumber?: string
  ifscCode?: string
  upiId?: string
}

export interface Supplier extends BaseEntity {
  code: string
  name: string
  contactPerson: string
  mobile: string
  email: string
  address: string
  countryId: ID | null
  countryName?: string
  stateId: ID | null
  stateName?: string
  cityId: ID | null
  cityName?: string
  pincode: string
  gstNumber?: string
  panNumber?: string
  paymentTerms: string | null
  creditDays: number
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  remarks?: string
  status: Status
}

export interface Vendor extends BaseEntity {
  code: string
  name: string
  vendorType: VendorType | null
  contactPerson: string
  mobile: string
  email: string
  address: string
  countryId: ID | null
  countryName?: string
  stateId: ID | null
  stateName?: string
  cityId: ID | null
  cityName?: string
  pincode: string
  gstNumber?: string
  serviceCategory?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  remarks?: string
  status: Status
}

// category/uom/materialGrade are resolved display names, mirroring the
// countryId+countryName pattern on Customer/Supplier/Vendor — the backend's
// item_master API only accepts the *Id fields (integer FKs into item_categories/
// uoms/material_grades), the plain-name fields are for display only.
export interface FinishedGood extends BaseEntity {
  code: string
  name: string
  categoryId?: ID | null
  category: string
  brand?: string
  uomId?: ID | null
  uom: string
  alternateUomId?: ID | null
  alternateUom?: string
  hsnCode?: string
  gstPercent?: number
  description?: string
  status: Status
  imageUrl?: string
  customerId?: ID | null
  customerName?: string
  customerPartNo?: string
  drawingNo?: string
  drawingRevision?: string
  drawingFileName?: string
  materialGradeId?: ID | null
  materialGrade?: string
  weight?: number
  price?: number
}

export interface RawMaterial extends BaseEntity {
  code: string
  name: string
  categoryId?: ID | null
  category: string
  brand?: string
  uomId?: ID | null
  uom: string
  alternateUomId?: ID | null
  alternateUom?: string
  hsnCode?: string
  gstPercent?: number
  description?: string
  status: Status
  imageUrl?: string
  materialGradeId?: ID | null
  materialGrade?: string
  materialType?: string
  shape?: string
  diameter?: number
  width?: number
  thickness?: number
  length?: number
  density?: number
  color?: string
  price?: number
}

export interface Consumable extends BaseEntity {
  code: string
  name: string
  categoryId?: ID | null
  category: string
  uomId?: ID | null
  uom: string
  alternateUomId?: ID | null
  alternateUom?: string
  hsnCode?: string
  gstPercent?: number
  description?: string
  status: Status
  imageUrl?: string
  price?: number
}

export interface Machine extends BaseEntity {
  code: string
  name: string
  machineMake?: string
  model?: string
  serialNumber?: string
  capacity?: string
  powerRating?: string
  installationDate?: string
  purchaseDate?: string
  warrantyExpiry?: string
  amcExpiry?: string
  maintenanceInterval?: string
  machineLocation?: string
  price?: number
}

export interface GaugeInstrument extends BaseEntity {
  code: string
  name: string
  gaugeType?: string
  instrumentRange?: string
  accuracy?: string
  leastCount?: string
  calibrationFrequency?: string
  calibrationDueDate?: string
  certificateNumber?: string
  manufacturer?: string
  categoryId?: ID | null
  category?: string
  price?: number
}

export interface PackingMaterial extends BaseEntity {
  code: string
  name: string
  categoryId?: ID | null
  category: string
  uomId?: ID | null
  uom: string
  price?: number
}

// Placeholder schema — spec spreadsheet has no field list for Fixture yet.
export interface Fixture extends BaseEntity {
  code: string
  name: string
  category: string
  uom: string
  price?: number
}

// Placeholder schema — spec spreadsheet has no field list for Die/Block yet.
export interface DieBlock extends BaseEntity {
  code: string
  name: string
  category: string
  uom: string
  price?: number
}
