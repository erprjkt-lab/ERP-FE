import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from '@/api/suppliers'
import type { ApiParty, CreatePartyPayload, PartyPayload } from '@/types/api/masters'
import type { Supplier } from '@/types/masters'
import type { SupplierInput } from '../store/mastersStore'

// See useCustomers.ts for why cityId isn't resolvable from the API response.
function toSupplier(api: ApiParty): Supplier {
  return {
    id: String(api.id),
    code: api.party_code,
    name: api.party_name,
    status: api.status === 0 ? 'inactive' : 'active',
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
    panNumber: api.pan_number ?? undefined,
    paymentTerms: api.payment_terms ?? null,
    creditDays: api.credit_days ?? 0,
    bankName: api.bank_name ?? undefined,
    accountNumber: api.account_number ?? undefined,
    ifscCode: api.ifsc_code ?? undefined,
    remarks: api.remarks ?? undefined,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function buildPartyFields(input: Partial<SupplierInput>): PartyPayload {
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
    pan_number: input.panNumber,
    payment_terms: input.paymentTerms ?? undefined,
    credit_days: input.creditDays,
    bank_name: input.bankName,
    account_number: input.accountNumber,
    ifsc_code: input.ifscCode,
    remarks: input.remarks,
    status: input.status === 'inactive' ? 0 : 1,
  }
}

function toCreatePayload(input: SupplierInput): CreatePartyPayload {
  return { ...buildPartyFields(input), party_name: input.name, mobile: input.mobile }
}

export function useSuppliers() {
  const query = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await listSuppliers()).data,
  })

  const data = query.data?.map(toSupplier)

  return { ...query, data, isLoading: query.isLoading }
}

export function useSupplier(id: string | undefined) {
  const query = useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => (await getSupplier(Number(id))).data,
    enabled: !!id,
  })

  const data = query.data ? toSupplier(query.data) : undefined

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SupplierInput) => createSupplier(toCreatePayload(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SupplierInput> }) =>
      updateSupplier(Number(id), buildPartyFields(payload)),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.id] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}
