import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { machinesApi } from '@/api/items'
import type { ApiItemMaster } from '@/types/api/masters'
import type { Machine } from '@/types/masters'
import type { MachineInput } from '../store/mastersStore'

function toMachine(api: ApiItemMaster): Machine {
  return {
    id: String(api.id),
    code: api.item_code,
    name: api.item_name,
    machineMake: api.machine_make ?? undefined,
    model: api.model ?? undefined,
    serialNumber: api.serial_number ?? undefined,
    capacity: api.capacity ?? undefined,
    powerRating: api.power_rating ?? undefined,
    installationDate: api.installation_date ?? undefined,
    purchaseDate: api.purchase_date ?? undefined,
    warrantyExpiry: api.warranty_expiry ?? undefined,
    amcExpiry: api.amc_expiry ?? undefined,
    maintenanceInterval: api.maintenance_interval ?? undefined,
    machineLocation: api.machine_location ?? undefined,
    price: api.price ?? undefined,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function toPayload(input: Partial<MachineInput>) {
  return {
    item_name: input.name,
    machine_make: input.machineMake,
    model: input.model,
    serial_number: input.serialNumber,
    capacity: input.capacity,
    power_rating: input.powerRating,
    installation_date: input.installationDate,
    purchase_date: input.purchaseDate,
    warranty_expiry: input.warrantyExpiry,
    amc_expiry: input.amcExpiry,
    maintenance_interval: input.maintenanceInterval,
    machine_location: input.machineLocation,
    price: input.price,
  }
}

export function useMachines() {
  const query = useQuery({
    queryKey: ['machines'],
    queryFn: async () => (await machinesApi.list()).data,
  })

  const data = query.data?.map(toMachine)

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MachineInput) => machinesApi.create(toPayload(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  })
}

export function useUpdateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MachineInput> }) =>
      machinesApi.update(Number(id), toPayload(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  })
}

export function useDeleteMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => machinesApi.remove(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  })
}
