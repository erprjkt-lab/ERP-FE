import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from '@/api/customers'
import type { ApiGstType, ApiParty, CreatePartyPayload, PartyPayload } from '@/types/api/masters'
import type { ApiCountry } from '@/types/api/world'
import type { Customer, GstType } from '@/types/masters'
import { useMastersLocalStore } from '../store/mastersLocalStore'
import type { CustomerInput } from '../store/mastersStore'
import { useCountries } from './useCountries'

const GST_TYPE_TO_API: Record<GstType, ApiGstType> = {
  regular: 'Regular',
  composition: 'Composition',
  unregistered: 'Unregistered',
  sez: 'SEZ',
  consumer: 'Consumer',
}

const GST_TYPE_FROM_API: Partial<Record<ApiGstType, GstType>> = {
  Regular: 'regular',
  Composition: 'composition',
  Unregistered: 'unregistered',
  SEZ: 'sez',
  Consumer: 'consumer',
}

function useCountriesById() {
  const { data: countries = [] } = useCountries()
  return new Map<string, ApiCountry>(countries.map(c => [String(c.id), c]))
}

// BE `city` is a free-text column (no city_id foreign key), so cityId can't be
// resolved back to a world-master city on read — only the display name survives
// the round trip. stateName is left unresolved for the same reason: the world API
// only supports listing states scoped to a known country, not a single state by id.
function toCustomer(
  api: ApiParty,
  customerType: Customer['customerType'],
  countriesById: Map<string, ApiCountry>,
): Customer {
  return {
    id: String(api.id),
    code: api.party_code,
    name: api.party_name,
    customerType,
    status: api.status === 0 ? 'inactive' : 'active',
    contactPerson: api.contact_person ?? '',
    mobile: api.mobile,
    email: api.email ?? '',
    website: api.website ?? undefined,
    address: api.address ?? '',
    countryId: api.country_id ? String(api.country_id) : null,
    countryName: api.country_id ? countriesById.get(String(api.country_id))?.name : undefined,
    stateId: api.state_id ? String(api.state_id) : null,
    stateName: undefined,
    cityId: null,
    cityName: api.city ?? undefined,
    pincode: api.pincode ?? '',
    gstNumber: api.gst_number ?? undefined,
    panNumber: api.pan_number ?? undefined,
    gstType: api.gst_type ? (GST_TYPE_FROM_API[api.gst_type] ?? null) : null,
    creditLimit: api.credit_limit ?? 0,
    creditDays: api.credit_days ?? 0,
    openingBalance: api.opening_balance ?? 0,
    paymentTerms: api.payment_terms ?? null,
    bankName: api.bank_name ?? undefined,
    bankBranch: api.branch_name ?? undefined,
    accountHolder: api.account_holder_name ?? undefined,
    accountNumber: api.account_number ?? undefined,
    ifscCode: api.ifsc_code ?? undefined,
    upiId: api.upi_id ?? undefined,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function buildPartyFields(input: Partial<CustomerInput>): PartyPayload {
  return {
    party_name: input.name,
    mobile: input.mobile,
    contact_person: input.contactPerson,
    email: input.email,
    website: input.website,
    address: input.address,
    country_id: input.countryId ? Number(input.countryId) : null,
    state_id: input.stateId ? Number(input.stateId) : null,
    city: input.cityName,
    pincode: input.pincode,
    gst_number: input.gstNumber,
    gst_type: input.gstType ? GST_TYPE_TO_API[input.gstType] : undefined,
    pan_number: input.panNumber,
    credit_limit: input.creditLimit,
    credit_days: input.creditDays,
    opening_balance: input.openingBalance,
    payment_terms: input.paymentTerms ?? undefined,
    bank_name: input.bankName,
    branch_name: input.bankBranch,
    account_holder_name: input.accountHolder,
    account_number: input.accountNumber,
    ifsc_code: input.ifscCode,
    upi_id: input.upiId,
    status: input.status === 'inactive' ? 0 : 1,
  }
}

function toCreatePayload(input: CustomerInput): CreatePartyPayload {
  return { ...buildPartyFields(input), party_name: input.name, mobile: input.mobile }
}

export function useCustomers() {
  const customerTypes = useMastersLocalStore(s => s.customerTypes)
  const countriesById = useCountriesById()
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await listCustomers()).data,
  })

  const data = query.data?.map(api =>
    toCustomer(api, customerTypes[String(api.id)] ?? null, countriesById),
  )

  return { ...query, data, isLoading: query.isLoading }
}

export function useCustomer(id: string | undefined) {
  const customerTypes = useMastersLocalStore(s => s.customerTypes)
  const countriesById = useCountriesById()
  const query = useQuery({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(Number(id)),
    enabled: !!id,
  })

  const data =
    query.data && id ? toCustomer(query.data, customerTypes[id] ?? null, countriesById) : undefined

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const setCustomerType = useMastersLocalStore(s => s.setCustomerType)
  return useMutation({
    mutationFn: async (input: CustomerInput) => {
      const result = await createCustomer(toCreatePayload(input))
      setCustomerType(String(result.id), input.customerType ?? null)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const setCustomerType = useMastersLocalStore(s => s.setCustomerType)
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomerInput> }) => {
      const result = await updateCustomer(Number(id), buildPartyFields(payload))
      if ('customerType' in payload) setCustomerType(id, payload.customerType ?? null)
      return result
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const removeCustomerType = useMastersLocalStore(s => s.removeCustomerType)
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteCustomer(Number(id))
      removeCustomerType(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  })
}
