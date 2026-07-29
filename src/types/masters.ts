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
