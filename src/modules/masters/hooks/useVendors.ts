import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createVendor, deleteVendor, getVendor, listVendors, updateVendor } from '@/api/vendors'
import type { ApiParty, CreatePartyPayload, PartyPayload } from '@/types/api/masters'
import type { Vendor } from '@/types/masters'
import type { VendorInput } from '../store/mastersStore'

// See useCustomers.ts for why cityId isn't resolvable from the API response.
function toVendor(api: ApiParty): Vendor {
  return {
    id: String(api.id),
    code: api.party_code,
    name: api.party_name,
    contactPerson: api.contact_person ?? '',
    mobile: api.mobile,
    email: api.email ?? '',
    address: api.address ?? '',
    countryId: api.country ? String(api.country.id) : null,
    countryName: api.country?.name,
    stateId: api.state ? String(api.state.id) : null,
    stateName: api.state?.name,
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

export function useVendors(page = 1, perPage = 100) {
  const query = useQuery({
    queryKey: ['vendors', page, perPage],
    queryFn: () => listVendors(page, perPage),
    // Keeps the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  })

  const data = query.data?.data.map(toVendor)

  return { ...query, data, meta: query.data?.meta, isLoading: query.isLoading }
}

export function useVendor(id: string | undefined) {
  const query = useQuery({
    queryKey: ['vendors', id],
    queryFn: async () => (await getVendor(Number(id))).data,
    enabled: !!id,
  })

  const data = query.data ? toVendor(query.data) : undefined

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VendorInput) => {
      return (await createVendor(toCreatePayload(input))).data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<VendorInput> }) => {
      return await updateVendor(Number(id), buildPartyFields(payload))
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.id] })
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteVendor(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendors'] }),
  })
}
