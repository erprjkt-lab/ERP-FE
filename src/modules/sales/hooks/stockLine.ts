import type { ApiStockLine } from '@/types/api/sales'
import type { StockLine } from '@/types/sales'

/** Challan and invoice lines share the same batch/location stock shape. */
export function toStockLine(api: ApiStockLine): StockLine {
  return {
    id: String(api.id),
    locationId: String(api.location_id),
    locationName: api.location_name ?? undefined,
    batchNo: api.batch_no,
    heatNo: api.heat_no,
    serialNo: api.serial_no,
    qty: Number(api.qty),
  }
}
