import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVendor, deleteVendor, getVendor, listVendors, updateVendor } from '@/api/vendors'
import type { ApiParty, CreatePartyPayload, PartyPayload } from '@/types/api/masters'
import type { ApiCountry } from '@/types/api/world'
import type { Vendor } from '@/types/masters'
import { useMastersLocalStore } from '../store/mastersLocalStore'
import type { VendorInput } from '../store/mastersStore'
import { useCountries } from './useCountries'

function useCountriesById() {
  const { data: countries = [] } = useCountries()
  return new Map<string, ApiCountry>(countries.map(c => [String(c.id), c]))
}

// See useCustomers.ts for why stateName/cityId aren't resolvable from the API response.
function toVendor(
  api: ApiParty,
  vendorType: Vendor['vendorType'],
  countriesById: Map<string, ApiCountry>,
): Vendor {
  return {
    id: String(api.id),
    code: api.party_code,
    name: api.party_name,
    vendorType,
    contactPerson: api.contact_person ?? '',
    mobile: api.mobile,
    email: api.email ?? '',
    address: api.address ?? '',
    countryId: api.country_id ? String(api.country_id) : null,
    countryName: api.country_id ? countriesById.get(String(api.country_id))?.name : undefined,
    stateId: api.state_id ? String(api.state_id) : null,
    stateName: undefined,
    cityId: null,
    cityName: api.city ?? undefined,
    pincode: api.pincode ?? '',
    gstNumber: api.gst_number ?? undefined,
    serviceCategory: api.service_category ?? undefined,
    bankName: api.bank_name ?? undefined,
    accountNumber: api.account_number ?? undefined,
    ifscCode: api.ifsc_code ?? undefined,
    remarks: api.remarks ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function buildPartyFields(input: Partial<VendorInput>): PartyPayload {
  return {
    party_name: input.name,
    mobile: input.mobile,
    contact_person: input.contactPerson,
    email: input.email,
    address: input.address,
    country_id: input.countryId ? Number(input.countryId) : null,
    state_id: input.stateId ? Number(input.stateId) : null,
    city: input.cityName,
    pincode: input.pincode,
    gst_number: input.gstNumber,
    service_category: input.serviceCategory,
    bank_name: input.bankName,
    account_number: input.accountNumber,
    ifsc_code: input.ifscCode,
    remarks: input.remarks,
    status: input.status === 'inactive' ? 0 : 1,
  }
}

function toCreatePayload(input: VendorInput): CreatePartyPayload {
  return { ...buildPartyFields(input), party_name: input.name, mobile: input.mobile }
}

export function useVendors() {
  const vendorTypes = useMastersLocalStore(s => s.vendorTypes)
  const countriesById = useCountriesById()
  const query = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => (await listVendors()).data,
  })

  const data = query.data?.map(api =>
    toVendor(api, vendorTypes[String(api.id)] ?? null, countriesById),
  )

  return { ...query, data, isLoading: query.isLoading }
}

export function useVendor(id: string | undefined) {
  const vendorTypes = useMastersLocalStore(s => s.vendorTypes)
  const countriesById = useCountriesById()
  const query = useQuery({
    queryKey: ['vendors', id],
    queryFn: () => getVendor(Number(id)),
    enabled: !!id,
  })

  const data =
    query.data && id ? toVendor(query.data, vendorTypes[id] ?? null, countriesById) : undefined

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  const setVendorType = useMastersLocalStore(s => s.setVendorType)
  return useMutation({
    mutationFn: async (input: VendorInput) => {
      const result = await createVendor(toCreatePayload(input))
      setVendorType(String(result.id), input.vendorType ?? null)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()
  const setVendorType = useMastersLocalStore(s => s.setVendorType)
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<VendorInput> }) => {
      const result = await updateVendor(Number(id), buildPartyFields(payload))
      if ('vendorType' in payload) setVendorType(id, payload.vendorType ?? null)
      return result
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.id] })
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()
  const removeVendorType = useMastersLocalStore(s => s.removeVendorType)
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteVendor(Number(id))
      removeVendorType(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  })
}
