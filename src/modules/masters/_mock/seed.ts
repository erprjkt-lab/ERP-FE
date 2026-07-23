import type { City, Country, Customer, Supplier, State, Vendor } from '@/types/masters'

export const MOCK_COUNTRIES: Country[] = [
  { id: 'country-1', name: 'India', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'country-2', name: 'United States', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'country-3', name: 'United Kingdom', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  {
    id: 'country-4',
    name: 'United Arab Emirates',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  { id: 'country-5', name: 'Singapore', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
]

export const MOCK_STATES: State[] = [
  {
    id: 'state-1',
    name: 'Maharashtra',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-2',
    name: 'Gujarat',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-3',
    name: 'Karnataka',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-4',
    name: 'Delhi',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-5',
    name: 'Tamil Nadu',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-6',
    name: 'Telangana',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-7',
    name: 'West Bengal',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-8',
    name: 'Rajasthan',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-9',
    name: 'Punjab',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-10',
    name: 'Kerala',
    countryId: 'country-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'state-11',
    name: 'California',
    countryId: 'country-2',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
]

export const MOCK_CITIES: City[] = [
  {
    id: 'city-1',
    name: 'Mumbai',
    stateId: 'state-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-2',
    name: 'Pune',
    stateId: 'state-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-3',
    name: 'Nashik',
    stateId: 'state-1',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-4',
    name: 'Ahmedabad',
    stateId: 'state-2',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-5',
    name: 'Surat',
    stateId: 'state-2',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-6',
    name: 'Bengaluru',
    stateId: 'state-3',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-7',
    name: 'New Delhi',
    stateId: 'state-4',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-8',
    name: 'Chennai',
    stateId: 'state-5',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-9',
    name: 'Hyderabad',
    stateId: 'state-6',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-10',
    name: 'Kolkata',
    stateId: 'state-7',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-11',
    name: 'Jaipur',
    stateId: 'state-8',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-12',
    name: 'Ludhiana',
    stateId: 'state-9',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-13',
    name: 'Kochi',
    stateId: 'state-10',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
  {
    id: 'city-14',
    name: 'Los Angeles',
    stateId: 'state-11',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  },
]

const CUSTOMER_NAMES = [
  'Shree Balaji Traders',
  'Sunrise Retail Chain',
  'Om Enterprises',
  'Green Valley Distributors',
  'Nova Corporate Solutions',
  'Metro Wholesale Mart',
  'Prime Foods Pvt Ltd',
  'Skyline Textiles',
  'Everest Hardware Co',
  'Coastal Agro Traders',
  'Silverline Electronics',
  'Horizon Government Supplies',
]

const CUSTOMER_TYPES = ['retail', 'wholesale', 'distributor', 'corporate', 'government'] as const
const GST_TYPES = ['regular', 'composition', 'unregistered', 'sez', 'consumer'] as const
const STATUSES = ['active', 'active', 'active', 'inactive'] as const
const CITY_IDS = MOCK_CITIES.map(c => c.id)
const STATE_BY_CITY = new Map(MOCK_CITIES.map(c => [c.id, c.stateId]))
const COUNTRY_BY_STATE = new Map(MOCK_STATES.map(s => [s.id, s.countryId]))

export const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 12 }, (_, i) => {
  const cityId = CITY_IDS[i % CITY_IDS.length]
  const stateId = STATE_BY_CITY.get(cityId) ?? null
  const countryId = stateId ? (COUNTRY_BY_STATE.get(stateId) ?? null) : null
  return {
    id: `customer-${i + 1}`,
    code: `CUST-${String(i + 1).padStart(4, '0')}`,
    name: CUSTOMER_NAMES[i % CUSTOMER_NAMES.length],
    customerType: CUSTOMER_TYPES[i % CUSTOMER_TYPES.length],
    status: STATUSES[i % STATUSES.length],
    contactPerson: 'Rakesh Sharma',
    mobile: `9${String(800000000 + i)}`,
    email: `contact${i + 1}@${CUSTOMER_NAMES[i % CUSTOMER_NAMES.length].toLowerCase().replace(/[^a-z]/g, '')}.com`,
    website: undefined,
    address: `${100 + i} Industrial Area`,
    countryId,
    stateId,
    cityId,
    pincode: `4${String(10000 + i * 11).slice(0, 5)}`,
    gstNumber: undefined,
    panNumber: undefined,
    gstType: GST_TYPES[i % GST_TYPES.length],
    creditLimit: 100000 + i * 25000,
    creditDays: [15, 30, 45, 60][i % 4],
    openingBalance: i * 5000,
    paymentTerms: ['due_on_receipt', 'net_15', 'net_30', 'net_45', 'net_60'][i % 5],
    bankName: 'State Bank of India',
    bankBranch: undefined,
    accountHolder: undefined,
    accountNumber: undefined,
    ifscCode: undefined,
    upiId: undefined,
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  }
})

const SUPPLIER_NAMES = [
  'Ganesh Raw Materials',
  'Vishwa Packaging Co',
  'Anand Steel Suppliers',
  'Krishna Chemicals',
  'Lakshmi Paper Mills',
  'Bharat Plastics',
  'National Fasteners',
  'Deccan Cotton Mills',
  'Aravali Minerals',
  'Ganga Timber Traders',
]

export const MOCK_SUPPLIERS: Supplier[] = Array.from({ length: 10 }, (_, i) => {
  const cityId = CITY_IDS[(i + 3) % CITY_IDS.length]
  const stateId = STATE_BY_CITY.get(cityId) ?? null
  const countryId = stateId ? (COUNTRY_BY_STATE.get(stateId) ?? null) : null
  return {
    id: `supplier-${i + 1}`,
    code: `SUPP-${String(i + 1).padStart(4, '0')}`,
    name: SUPPLIER_NAMES[i % SUPPLIER_NAMES.length],
    contactPerson: 'Suresh Patel',
    mobile: `9${String(700000000 + i)}`,
    email: `procurement${i + 1}@${SUPPLIER_NAMES[i % SUPPLIER_NAMES.length].toLowerCase().replace(/[^a-z]/g, '')}.com`,
    address: `${200 + i} Supplier Estate`,
    countryId,
    stateId,
    cityId,
    pincode: `5${String(10000 + i * 13).slice(0, 5)}`,
    gstNumber: undefined,
    panNumber: undefined,
    paymentTerms: ['net_15', 'net_30', 'net_45'][i % 3],
    creditDays: [15, 30, 45][i % 3],
    bankName: 'HDFC Bank',
    accountNumber: undefined,
    ifscCode: undefined,
    remarks: undefined,
    status: STATUSES[i % STATUSES.length],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  }
})

const VENDOR_NAMES = [
  'Apex Facility Services',
  'Reliable Logistics Partners',
  'Quantum IT Consultants',
  'Trustline Security Services',
  'Vertex Maintenance Works',
  'Crest Transport Co',
  'Meridian Legal Advisors',
  'Zenith Cleaning Solutions',
]

export const MOCK_VENDORS: Vendor[] = Array.from({ length: 8 }, (_, i) => {
  const cityId = CITY_IDS[(i + 6) % CITY_IDS.length]
  const stateId = STATE_BY_CITY.get(cityId) ?? null
  const countryId = stateId ? (COUNTRY_BY_STATE.get(stateId) ?? null) : null
  return {
    id: `vendor-${i + 1}`,
    code: `VEND-${String(i + 1).padStart(4, '0')}`,
    name: VENDOR_NAMES[i % VENDOR_NAMES.length],
    vendorType: (['service', 'contractor', 'consultant', 'transporter', 'other'] as const)[i % 5],
    contactPerson: 'Meera Nair',
    mobile: `9${String(600000000 + i)}`,
    email: `hello${i + 1}@${VENDOR_NAMES[i % VENDOR_NAMES.length].toLowerCase().replace(/[^a-z]/g, '')}.com`,
    address: `${300 + i} Business Park`,
    countryId,
    stateId,
    cityId,
    pincode: `6${String(10000 + i * 17).slice(0, 5)}`,
    gstNumber: undefined,
    serviceCategory: ['Facility Management', 'Logistics', 'IT Services', 'Security', 'Maintenance'][
      i % 5
    ],
    bankName: 'ICICI Bank',
    accountNumber: undefined,
    ifscCode: undefined,
    remarks: undefined,
    status: STATUSES[i % STATUSES.length],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  }
})
