import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiItemMaster, ItemMasterPayload } from '@/types/api/masters'

// All 6 item-master entities (finished-goods, raw-materials, consumables,
// machines, gauge-instruments, packing-materials) are one shared `item_master`
// table on the backend, differing only by `item_type` and by which columns
// each controller validates — the route path is the only real difference,
// so a factory avoids 30 near-identical hand-written functions.
function makeItemEndpoints(resourcePath: string) {
  return {
    list: (page = 1): Promise<PaginatedEnvelope<ApiItemMaster>> =>
      apiRequest(`/api/v1/${resourcePath}`, { query: { page, per_page: 100 } }),
    get: (id: number): Promise<ApiEnvelope<ApiItemMaster>> =>
      apiRequest(`/api/v1/${resourcePath}/${id}`),
    create: (payload: ItemMasterPayload): Promise<ApiEnvelope<ApiItemMaster>> =>
      apiRequest(`/api/v1/${resourcePath}`, { method: 'POST', body: payload }),
    update: (id: number, payload: ItemMasterPayload): Promise<ApiEnvelope<ApiItemMaster>> =>
      apiRequest(`/api/v1/${resourcePath}/${id}`, { method: 'PUT', body: payload }),
    remove: (id: number): Promise<void> =>
      apiRequest(`/api/v1/${resourcePath}/${id}`, { method: 'DELETE' }),
  }
}

export const finishedGoodsApi = makeItemEndpoints('finished-goods')
export const rawMaterialsApi = makeItemEndpoints('raw-materials')
export const consumablesApi = makeItemEndpoints('consumables')
export const machinesApi = makeItemEndpoints('machines')
export const gaugeInstrumentsApi = makeItemEndpoints('gauge-instruments')
export const packingMaterialsApi = makeItemEndpoints('packing-materials')
