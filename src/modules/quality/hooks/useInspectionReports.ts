import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addInspectionReading,
  approveInspectionReport,
  createIncomingInspectionReport,
  createInspectionReport,
  getInspectionReport,
  listIncomingInspectionReportsForGrnItem,
  listInspectionReportsForJobCard,
  submitInspectionReport,
} from '@/api/inspectionReports'
import { REPORT_TYPE_FIR, REPORT_TYPE_IIR, REPORT_TYPE_IPR, RESULT_PASS } from '@/types/api/quality'
import type {
  AddInspectionReadingPayload,
  ApiInspectionReading,
  ApiInspectionReport,
  CreateIncomingInspectionReportPayload,
  CreateInspectionReportPayload,
} from '@/types/api/quality'
import type { InspectionReading, InspectionReport, InspectionReportType } from '@/types/quality'

const TYPE_FROM_API: Record<number, InspectionReportType> = {
  [REPORT_TYPE_IPR]: 'IPR',
  [REPORT_TYPE_FIR]: 'FIR',
  [REPORT_TYPE_IIR]: 'IIR',
}

export const TYPE_TO_API: Record<InspectionReportType, number> = {
  IPR: REPORT_TYPE_IPR,
  FIR: REPORT_TYPE_FIR,
  IIR: REPORT_TYPE_IIR,
}

const STATUS_FROM_API = ['DRAFT', 'SUBMITTED', 'APPROVED'] as const

function toReading(api: ApiInspectionReading): InspectionReading {
  return {
    id: String(api.id),
    parameterId: String(api.parameter_id),
    parameterName: api.parameter_name ?? undefined,
    readingDate: api.reading_date ?? undefined,
    measuredValue: Number(api.measured_value),
    toleranceMin: api.tolerance_min != null ? Number(api.tolerance_min) : null,
    toleranceMax: api.tolerance_max != null ? Number(api.tolerance_max) : null,
    result: api.result === RESULT_PASS ? 'PASS' : 'FAIL',
  }
}

function toReport(api: ApiInspectionReport): InspectionReport {
  return {
    id: String(api.id),
    reportType: TYPE_FROM_API[api.report_type] ?? 'IPR',
    reportNumber: api.report_number,
    reportDate: api.report_date ?? undefined,
    jobCardId: api.job_card_id ? String(api.job_card_id) : undefined,
    grnId: api.grn_id ? String(api.grn_id) : undefined,
    grnItemId: api.grn_item_id ? String(api.grn_item_id) : undefined,
    itemId: String(api.item_id),
    itemName: api.item_name ?? api.item?.item_name ?? undefined,
    processId: api.process_id ? String(api.process_id) : undefined,
    processName: api.process_name ?? api.process?.process_name ?? undefined,
    itemRevision: api.item_revision ?? undefined,
    samplingQty: api.sampling_qty ?? undefined,
    okQty: api.ok_qty != null ? Number(api.ok_qty) : undefined,
    rejectedQty: api.rejected_qty != null ? Number(api.rejected_qty) : undefined,
    attachmentPath: api.attachment_path ?? undefined,
    status: STATUS_FROM_API[api.status] ?? 'DRAFT',
    approvedBy: api.approved_by != null ? String(api.approved_by) : null,
    approvedAt: api.approved_at,
    readings: (api.readings ?? []).map(toReading),
    createdAt: api.created_at ?? undefined,
  }
}

export function useInspectionReportsForJobCard(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['quality', 'jobCardReports', jobCardId],
    queryFn: async () => (await listInspectionReportsForJobCard(Number(jobCardId))).data,
    enabled: !!jobCardId,
  })
  return { data: (query.data ?? []).map(toReport), isLoading: query.isLoading }
}

export function useIncomingInspectionReportsForGrnItem(grnItemId: string | undefined) {
  const query = useQuery({
    queryKey: ['quality', 'grnItemReports', grnItemId],
    queryFn: async () => (await listIncomingInspectionReportsForGrnItem(Number(grnItemId))).data,
    enabled: !!grnItemId,
  })
  const data = (query.data ?? []).map(toReport)
  return {
    data,
    isLoading: query.isLoading,
    hasApprovedIir: data.some(r => r.status === 'APPROVED'),
  }
}

export function useInspectionReport(id: string | undefined) {
  const query = useQuery({
    queryKey: ['quality', 'report', id],
    queryFn: async () => (await getInspectionReport(Number(id))).data,
    enabled: !!id,
  })
  return { data: query.data ? toReport(query.data) : undefined, isLoading: query.isLoading }
}

function invalidateReportQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  report: InspectionReport,
) {
  queryClient.invalidateQueries({ queryKey: ['quality', 'report', report.id] })
  if (report.jobCardId) {
    queryClient.invalidateQueries({ queryKey: ['quality', 'jobCardReports', report.jobCardId] })
  }
  if (report.grnItemId) {
    queryClient.invalidateQueries({ queryKey: ['quality', 'grnItemReports', report.grnItemId] })
  }
}

export function useCreateInspectionReport(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateInspectionReportPayload) =>
      toReport((await createInspectionReport(Number(jobCardId), payload)).data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['quality', 'jobCardReports', jobCardId] }),
  })
}

export function useCreateIncomingInspectionReport(grnItemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateIncomingInspectionReportPayload) =>
      toReport((await createIncomingInspectionReport(Number(grnItemId), payload)).data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['quality', 'grnItemReports', grnItemId] }),
  })
}

export function useSubmitInspectionReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => toReport((await submitInspectionReport(Number(id))).data),
    onSuccess: report => invalidateReportQueries(queryClient, report),
  })
}

export function useApproveInspectionReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => toReport((await approveInspectionReport(Number(id))).data),
    onSuccess: report => invalidateReportQueries(queryClient, report),
  })
}

export function useAddInspectionReading(reportId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AddInspectionReadingPayload) =>
      toReading((await addInspectionReading(Number(reportId), payload)).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quality', 'report', reportId] }),
  })
}
