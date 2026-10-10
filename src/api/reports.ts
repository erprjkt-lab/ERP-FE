import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiSalesFunnelReport, ReportFilters } from '@/types/api/reports'

/** All report endpoints share one envelope and one query contract, so a single
 * typed call covers eighteen of them; the report's slug picks the endpoint. */
export function getReport<T>(
  slug: string,
  filters: ReportFilters,
  page: number,
  perPage: number,
): Promise<PaginatedEnvelope<T>> {
  return apiRequest(`/api/v1/reports/${slug}`, {
    query: { ...filters, page, per_page: perPage },
  })
}

/** Sales funnel is the one report that returns stage totals rather than rows. */
export function getSalesFunnelReport(
  filters: ReportFilters,
): Promise<ApiEnvelope<ApiSalesFunnelReport>> {
  return apiRequest('/api/v1/reports/sales-funnel', { query: { ...filters } })
}
