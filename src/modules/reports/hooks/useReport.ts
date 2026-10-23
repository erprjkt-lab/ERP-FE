import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getReport, getSalesFunnelReport } from '@/api/reports'
import type { ReportFilters } from '@/types/api/reports'

export function useReport<T>(slug: string, filters: ReportFilters, page: number, perPage: number) {
  const query = useQuery({
    queryKey: ['report', slug, filters, page, perPage],
    queryFn: () => getReport<T>(slug, filters, page, perPage),
    // Paging a report shouldn't blank the grid between fetches.
    placeholderData: keepPreviousData,
  })

  return {
    rows: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useSalesFunnelReport(filters: ReportFilters) {
  const query = useQuery({
    queryKey: ['report', 'sales-funnel', filters],
    queryFn: async () => (await getSalesFunnelReport(filters)).data,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

/** Pulls every page in one shot for CSV export, which must not be limited to the
 * page on screen. Report endpoints are read-only aggregates, so one wide page is
 * cheaper than walking the paginator. */
export async function fetchAllReportRows<T>(slug: string, filters: ReportFilters): Promise<T[]> {
  const response = await getReport<T>(slug, filters, 1, 10000)
  return response.data
}
