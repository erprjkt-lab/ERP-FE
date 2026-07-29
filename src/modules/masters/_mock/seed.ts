import type { Customer, Supplier, Vendor } from '@/types/masters'

// Demo-only country/state/city labels for seeding mock party records.
// These are no longer backed by local master data (see the `world` API
// hooks in ../hooks), so seeded records carry no resolvable id — just a
// display name — until re-saved through a form against the real API.
const DEMO_LOCATIONS = [
  { countryName: 'India', stateName: 'Maharashtra', cityName: 'Mumbai' },
  { countryName: 'India', stateName: 'Maharashtra', cityName: 'Pune' },
  { countryName: 'India', stateName: 'Maharashtra', cityName: 'Nashik' },
  { countryName: 'India', stateName: 'Gujarat', cityName: 'Ahmedabad' },
  { countryName: 'India', stateName: 'Gujarat', cityName: 'Surat' },
  { countryName: 'India', stateName: 'Karnataka', cityName: 'Bengaluru' },
  { countryName: 'India', stateName: 'Delhi', cityName: 'New Delhi' },
  { countryName: 'India', stateName: 'Tamil Nadu', cityName: 'Chennai' },
  { countryName: 'India', stateName: 'Telangana', cityName: 'Hyderabad' },
  { countryName: 'India', stateName: 'West Bengal', cityName: 'Kolkata' },
  { countryName: 'India', stateName: 'Rajasthan', cityName: 'Jaipur' },
  { countryName: 'India', stateName: 'Punjab', cityName: 'Ludhiana' },
  { countryName: 'India', stateName: 'Kerala', cityName: 'Kochi' },
  { countryName: 'United States', stateName: 'California', cityName: 'Los Angeles' },
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

export const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 12 }, (_, i) => {
  const location = DEMO_LOCATIONS[i % DEMO_LOCATIONS.length]
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
    countryId: null,
    countryName: location.countryName,
    stateId: null,
    stateName: location.stateName,
    cityId: null,
    cityName: location.cityName,
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
  const location = DEMO_LOCATIONS[(i + 3) % DEMO_LOCATIONS.length]
  return {
    id: `supplier-${i + 1}`,
    code: `SUPP-${String(i + 1).padStart(4, '0')}`,
    name: SUPPLIER_NAMES[i % SUPPLIER_NAMES.length],
    contactPerson: 'Suresh Patel',
    mobile: `9${String(700000000 + i)}`,
    email: `procurement${i + 1}@${SUPPLIER_NAMES[i % SUPPLIER_NAMES.length].toLowerCase().replace(/[^a-z]/g, '')}.com`,
    address: `${200 + i} Supplier Estate`,
    countryId: null,
    countryName: location.countryName,
    stateId: null,
    stateName: location.stateName,
    cityId: null,
    cityName: location.cityName,
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
  const location = DEMO_LOCATIONS[(i + 6) % DEMO_LOCATIONS.length]
  return {
    id: `vendor-${i + 1}`,
    code: `VEND-${String(i + 1).padStart(4, '0')}`,
    name: VENDOR_NAMES[i % VENDOR_NAMES.length],
    vendorType: (['service', 'contractor', 'consultant', 'transporter', 'other'] as const)[i % 5],
    contactPerson: 'Meera Nair',
    mobile: `9${String(600000000 + i)}`,
    email: `hello${i + 1}@${VENDOR_NAMES[i % VENDOR_NAMES.length].toLowerCase().replace(/[^a-z]/g, '')}.com`,
    address: `${300 + i} Business Park`,
    countryId: null,
    countryName: location.countryName,
    stateId: null,
    stateName: location.stateName,
    cityId: null,
    cityName: location.cityName,
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
