import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLocation,
  deactivateLocation,
  deleteLocation,
  listLocations,
  updateLocation,
} from '@/api/locations'
import type { ApiLocation, CreateLocationPayload, UpdateLocationPayload } from '@/types/api/masters'
import type { StoreLocation } from '@/types/masters'

export interface LocationOption {
  id: string
  code: string
  name: string
  isActive: boolean
}

function toLocation(api: ApiLocation): LocationOption {
  return { id: String(api.id), code: api.code, name: api.name, isActive: api.is_active }
}

function toStoreLocation(api: ApiLocation): StoreLocation {
  return {
    id: String(api.id),
    code: api.code,
    name: api.name,
    parentLocationId: api.parent_location_id ? String(api.parent_location_id) : null,
    locationType: api.location_type,
    isActive: api.is_active,
    isSystem: api.location_type > 0,
    createdAt: api.created_at ?? '',
  }
}

export function useLocations() {
  const query = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await listLocations()).data,
  })
  return { data: (query.data ?? []).map(toLocation), isLoading: query.isLoading }
}

/** The same rows as useLocations(), shaped for the Store Location master screen. */
export function useStoreLocations() {
  const query = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await listLocations()).data,
  })
  return { data: (query.data ?? []).map(toStoreLocation), isLoading: query.isLoading }
}

function useLocationInvalidation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['locations'] })
}

export function useCreateLocation() {
  const invalidate = useLocationInvalidation()
  return useMutation({
    mutationFn: (payload: CreateLocationPayload) => createLocation(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateLocation() {
  const invalidate = useLocationInvalidation()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLocationPayload }) =>
      updateLocation(Number(id), payload),
    onSuccess: invalidate,
  })
}

export function useDeactivateLocation() {
  const invalidate = useLocationInvalidation()
  return useMutation({
    mutationFn: (id: string) => deactivateLocation(Number(id)),
    onSuccess: invalidate,
  })
}

export function useDeleteLocation() {
  const invalidate = useLocationInvalidation()
  return useMutation({
    mutationFn: (id: string) => deleteLocation(Number(id)),
    onSuccess: invalidate,
  })
}
