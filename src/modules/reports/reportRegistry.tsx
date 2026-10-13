import { Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { ReportFilterKey } from '@/types/api/reports'
import type {
  ApiAuditLogReportRow,
  ApiCustomerComplaintsReportRow,
  ApiCustomerSalesSummaryReportRow,
  ApiGrnRegisterReportRow,
  ApiInspectionSummaryReportRow,
  ApiJobCardStatusReportRow,
  ApiOpeningVsCurrentReportRow,
  ApiOrderFulfillmentReportRow,
  ApiOutsourceChallanReportRow,
  ApiProductionOutputReportRow,
  ApiPurchaseOrderStatusReportRow,
  ApiRejectionReportRow,
  ApiReorderReportRow,
  ApiSalesRegisterReportRow,
  ApiStockLedgerReportRow,
  ApiStockTransferReportRow,
  ApiStockValuationReportRow,
  ApiSupplierPerformanceReportRow,
} from '@/types/api/reports'

export type ReportCategory = 'sales' | 'stock' | 'production' | 'purchase' | 'quality' | 'system'

/** A report row read generically by the grid — the registry's erased row type. */
export type ReportRowRecord = Record<string, unknown>

export interface ReportDefinition<T = ReportRowRecord> {
  /** URL slug — both the BE endpoint segment and the FE route segment. */
  slug: string
  title: string
  description: string
  category: ReportCategory
  /** ERP-BE permission guarding the endpoint (config/rbac_modules.php). */
  permission: string
  filters: ReportFilterKey[]
  columns: TableColumnsType<T>
  /** Rows carrying a nested array render it as an expanded sub-table. */
  expand?: { key: 'lines' | 'items'; columns: TableColumnsType<ReportRowRecord> }
  /** Sales funnel returns stage totals, not rows — it gets its own view. */
  custom?: 'sales-funnel'
}

/** Each report is authored against its own row type, then erased so the registry
 * is one uniform list the generic page can walk. The cast lives here alone. */
export type RegisteredReport = ReportDefinition<ReportRowRecord>

function defineReport<T extends object>(definition: ReportDefinition<T>): RegisteredReport {
  return definition as unknown as RegisteredReport
}

const num = (v: number | null | undefined) => (v == null ? '—' : v)
const money = (v: number | null | undefined) => (v == null ? '—' : Number(v).toFixed(2))
const dash = (v: string | null | undefined) => v || '—'
const pct = (v: number | null | undefined) => (v == null ? '—' : `${Number(v).toFixed(1)}%`)

const right = { align: 'right' as const }

// ── Stock ────────────────────────────────────────────────────────────────────

const stockLedger: ReportDefinition<ApiStockLedgerReportRow> = {
  slug: 'stock-ledger',
  title: 'Stock Ledger',
  description: 'Full movement history, filterable by item, location and date.',
  category: 'stock',
  permission: 'read report-stock-ledger',
  filters: ['item_id', 'location_id', 'transaction_type', 'from_date', 'to_date'],
  columns: [
    { title: 'Date', dataIndex: 'transaction_date', render: dash },
    {
      title: 'Transaction',
      dataIndex: 'transaction_label',
      render: (label: string, row) => (
        <span>
          {label}{' '}
          <Tag color={row.direction === 'in' ? 'green' : 'red'}>{row.direction?.toUpperCase()}</Tag>
        </span>
      ),
    },
    { title: 'Item Code', dataIndex: 'item_code' },
    { title: 'Item', dataIndex: 'item_name' },
    { title: 'Location', dataIndex: 'location_name', render: dash },
    { title: 'Batch', dataIndex: 'batch_no', render: dash },
    { title: 'Qty', dataIndex: 'quantity', ...right, render: num },
    { title: 'Rate', dataIndex: 'rate', ...right, render: money },
  ],
}

const stockValuation: ReportDefinition<ApiStockValuationReportRow> = {
  slug: 'stock-valuation',
  title: 'Stock Valuation',
  description: 'Quantity × average rate, per item and location.',
  category: 'stock',
  permission: 'read report-stock-valuation',
  filters: ['item_id', 'location_id'],
  columns: [
    { title: 'Item Code', dataIndex: 'item_code' },
    { title: 'Item', dataIndex: 'item_name' },
    { title: 'Location', dataIndex: 'location_name', render: dash },
    { title: 'Batch', dataIndex: 'batch_no', render: dash },
    { title: 'Qty', dataIndex: 'qty', ...right, render: num },
    { title: 'Avg Rate', dataIndex: 'avg_rate', ...right, render: money },
    { title: 'Value', dataIndex: 'value', ...right, render: money },
  ],
}

const reorder: ReportDefinition<ApiReorderReportRow> = {
  slug: 'reorder',
  title: 'Reorder / Low Stock',
  description: 'Items below their safety reorder level, with shortfall.',
  category: 'stock',
  permission: 'read report-reorder',
  filters: ['item_id', 'location_id'],
  columns: [
    { title: 'Item Code', dataIndex: 'item_code' },
    { title: 'Item', dataIndex: 'item_name' },
    { title: 'Location', dataIndex: 'location_name', render: dash },
    { title: 'Qty', dataIndex: 'qty', ...right, render: num },
    { title: 'Reorder Level', dataIndex: 'reorder_level', ...right, render: num },
    {
      title: 'Shortfall',
      dataIndex: 'shortfall',
      ...right,
      render: (v: number) => <Tag color={v > 0 ? 'red' : 'default'}>{v}</Tag>,
    },
  ],
}

const stockTransfer: ReportDefinition<ApiStockTransferReportRow> = {
  slug: 'stock-transfer',
  title: 'Stock Transfer',
  description: 'Transfers between locations over a period.',
  category: 'stock',
  permission: 'read report-stock-transfer',
  filters: ['from_location_id', 'to_location_id', 'from_date', 'to_date'],
  columns: [
    { title: 'Transfer No', dataIndex: 'transfer_number' },
    { title: 'Date', dataIndex: 'transfer_date', render: dash },
    { title: 'From', dataIndex: 'from_location', render: dash },
    { title: 'To', dataIndex: 'to_location', render: dash },
    { title: 'Lines', dataIndex: 'line_count', ...right, render: num },
    { title: 'Total Qty', dataIndex: 'total_qty', ...right, render: num },
  ],
  expand: {
    key: 'items',
    columns: [
      { title: 'Item Code', dataIndex: 'item_code' },
      { title: 'Item', dataIndex: 'item_name' },
      { title: 'Batch', dataIndex: 'batch_no', render: dash },
      { title: 'Qty', dataIndex: 'qty', ...right, render: num },
    ],
  },
}

const openingVsCurrent: ReportDefinition<ApiOpeningVsCurrentReportRow> = {
  slug: 'opening-vs-current',
  title: 'Opening vs Current Stock',
  description: 'Variance between opening and current quantity.',
  category: 'stock',
  permission: 'read report-opening-vs-current',
  filters: ['item_id', 'location_id'],
  columns: [
    { title: 'Item Code', dataIndex: 'item_code' },
    { title: 'Item', dataIndex: 'item_name' },
    { title: 'Location', dataIndex: 'location_name', render: dash },
    { title: 'Opening Qty', dataIndex: 'opening_qty', ...right, render: num },
    { title: 'Current Qty', dataIndex: 'current_qty', ...right, render: num },
    {
      title: 'Variance',
      dataIndex: 'variance',
      ...right,
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#DC2626' : v > 0 ? '#16A34A' : undefined }}>{v}</span>
      ),
    },
  ],
}

// ── Sales ────────────────────────────────────────────────────────────────────

const salesRegister: ReportDefinition<ApiSalesRegisterReportRow> = {
  slug: 'sales-register',
  title: 'Sales Register',
  description: 'Invoice values by date range, customer and status.',
  category: 'sales',
  permission: 'read report-sales-register',
  filters: ['party_id', 'status', 'from_date', 'to_date'],
  columns: [
    { title: 'Invoice No', dataIndex: 'invoice_number' },
    { title: 'Date', dataIndex: 'invoice_date', render: dash },
    { title: 'Customer', dataIndex: 'party', render: dash },
    { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Taxable', dataIndex: 'taxable_amount', ...right, render: money },
    { title: 'Tax', dataIndex: 'tax_amount', ...right, render: money },
    { title: 'Net Amount', dataIndex: 'net_amount', ...right, render: money },
  ],
}

const orderFulfillment: ReportDefinition<ApiOrderFulfillmentReportRow> = {
  slug: 'order-fulfillment',
  title: 'Order Fulfillment',
  description: 'Ordered vs dispatched quantity per sales order line.',
  category: 'sales',
  permission: 'read report-order-fulfillment',
  filters: ['party_id', 'status', 'from_date', 'to_date'],
  columns: [
    { title: 'Order No', dataIndex: 'order_number' },
    { title: 'Date', dataIndex: 'order_date', render: dash },
    { title: 'Customer', dataIndex: 'party', render: dash },
    { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Lines',
      dataIndex: 'lines',
      ...right,
      render: (lines: unknown[]) => lines?.length ?? 0,
    },
  ],
  expand: {
    key: 'lines',
    columns: [
      { title: 'Item Code', dataIndex: 'item_code' },
      { title: 'Item', dataIndex: 'item_name' },
      { title: 'Ordered', dataIndex: 'ordered_qty', ...right, render: num },
      { title: 'Dispatched', dataIndex: 'dispatched_qty', ...right, render: num },
      { title: 'Pending', dataIndex: 'pending_qty', ...right, render: num },
    ],
  },
}

const customerSalesSummary: ReportDefinition<ApiCustomerSalesSummaryReportRow> = {
  slug: 'customer-sales-summary',
  title: 'Customer-wise Sales Summary',
  description: 'Revenue and invoice count ranked by customer.',
  category: 'sales',
  permission: 'read report-customer-sales-summary',
  filters: ['from_date', 'to_date'],
  columns: [
    { title: 'Customer', dataIndex: 'party_name' },
    { title: 'Invoices', dataIndex: 'invoice_count', ...right, render: num },
    { title: 'Total Net Amount', dataIndex: 'total_net_amount', ...right, render: money },
  ],
}

const salesFunnel: ReportDefinition = {
  slug: 'sales-funnel',
  title: 'Sales Funnel Conversion',
  description: 'Enquiry → Quotation → Order → Challan → Invoice, with drop-off per stage.',
  category: 'sales',
  permission: 'read report-sales-funnel',
  filters: ['from_date', 'to_date'],
  columns: [],
  custom: 'sales-funnel',
}

// ── Production ───────────────────────────────────────────────────────────────

const jobCardStatus: ReportDefinition<ApiJobCardStatusReportRow> = {
  slug: 'job-card-status',
  title: 'Job Card Status',
  description: 'Every job card with its stage, target date and overdue flag.',
  category: 'production',
  permission: 'read report-job-card-status',
  filters: ['status', 'item_id', 'party_id', 'overdue_only', 'from_date', 'to_date'],
  columns: [
    { title: 'Job Card', dataIndex: 'job_card_number' },
    { title: 'Date', dataIndex: 'job_card_date', render: dash },
    { title: 'Item', dataIndex: 'item_name', render: dash },
    { title: 'Customer', dataIndex: 'party_name', render: dash },
    { title: 'Process', dataIndex: 'current_process', render: dash },
    { title: 'Ordered Qty', dataIndex: 'ordered_qty', ...right, render: num },
    { title: 'Status', dataIndex: 'status_label', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Target', dataIndex: 'target_date', render: dash },
    {
      title: 'Overdue',
      dataIndex: 'is_overdue',
      render: (overdue: boolean, row) =>
        overdue ? (
          <Tag color="red">{row.days_overdue}d late</Tag>
        ) : (
          <Tag color="green">On time</Tag>
        ),
    },
  ],
}

const productionOutput: ReportDefinition<ApiProductionOutputReportRow> = {
  slug: 'production-output',
  title: 'Production Output',
  description: 'Receipt quantities against planned, per job card.',
  category: 'production',
  permission: 'read report-production-output',
  filters: ['job_card_id', 'from_date', 'to_date'],
  columns: [
    { title: 'Job Card', dataIndex: 'job_card_number' },
    { title: 'Item Code', dataIndex: 'item_code', render: dash },
    { title: 'Item', dataIndex: 'item_name', render: dash },
    { title: 'Ordered Qty', dataIndex: 'ordered_qty', ...right, render: num },
    { title: 'Received Qty', dataIndex: 'received_qty', ...right, render: num },
    { title: 'Received At', dataIndex: 'received_at', render: dash },
  ],
}

const rejections: ReportDefinition<ApiRejectionReportRow> = {
  slug: 'rejections',
  title: 'Rejection Report',
  description: 'Rejection quantity by item, process and reason.',
  category: 'production',
  permission: 'read report-rejections',
  filters: ['job_card_id', 'review_status', 'from_date', 'to_date'],
  columns: [
    { title: 'Job Card', dataIndex: 'job_card_number' },
    { title: 'Process', dataIndex: 'process', render: dash },
    { title: 'Reason Code', dataIndex: 'reason_code', render: dash },
    { title: 'Reason', dataIndex: 'reason', render: dash },
    { title: 'Rejected Qty', dataIndex: 'rejected_qty', ...right, render: num },
    { title: 'Review', dataIndex: 'review_status_label', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Raised On', dataIndex: 'created_at', render: dash },
  ],
}

const outsourceChallans: ReportDefinition<ApiOutsourceChallanReportRow> = {
  slug: 'outsource-challans',
  title: 'Outsource Challan',
  description: 'Material sent versus received back, with ageing.',
  category: 'production',
  permission: 'read report-outsource-challans',
  filters: ['job_card_id', 'status', 'from_date', 'to_date'],
  columns: [
    { title: 'Job Card', dataIndex: 'job_card_number' },
    { title: 'Process', dataIndex: 'process', render: dash },
    { title: 'Requested', dataIndex: 'requested_qty', ...right, render: num },
    { title: 'Dispatched', dataIndex: 'dispatched_qty', ...right, render: num },
    { title: 'Consumed', dataIndex: 'consumed_qty', ...right, render: num },
    { title: 'Status', dataIndex: 'status_label', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Requested By', dataIndex: 'requested_by', render: dash },
    {
      title: 'Ageing',
      dataIndex: 'days_pending',
      ...right,
      render: (d: number) => <Tag color={d > 7 ? 'red' : d > 3 ? 'orange' : 'default'}>{d}d</Tag>,
    },
  ],
}

// ── Purchase ─────────────────────────────────────────────────────────────────

const grnRegister: ReportDefinition<ApiGrnRegisterReportRow> = {
  slug: 'grn-register',
  title: 'GRN Register',
  description: 'All goods receipts with QC status, by supplier and date.',
  category: 'purchase',
  permission: 'read report-grn-register',
  filters: ['supplier_id', 'status', 'from_date', 'to_date'],
  columns: [
    { title: 'GRN No', dataIndex: 'grn_no' },
    { title: 'Date', dataIndex: 'grn_date', render: dash },
    { title: 'Supplier', dataIndex: 'supplier', render: dash },
    { title: 'Status', dataIndex: 'status_label', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Accepted Qty', dataIndex: 'total_accepted_qty', ...right, render: num },
    { title: 'Rejected Qty', dataIndex: 'total_rejected_qty', ...right, render: num },
  ],
}

const supplierPerformance: ReportDefinition<ApiSupplierPerformanceReportRow> = {
  slug: 'supplier-performance',
  title: 'Supplier Performance',
  description: 'Receipt volume and rejection rate per supplier.',
  category: 'purchase',
  permission: 'read report-supplier-performance',
  filters: ['from_date', 'to_date'],
  columns: [
    { title: 'Supplier', dataIndex: 'supplier_name' },
    { title: 'GRNs', dataIndex: 'grn_count', ...right, render: num },
    { title: 'Accepted Qty', dataIndex: 'total_accepted_qty', ...right, render: num },
    { title: 'Rejected Qty', dataIndex: 'total_rejected_qty', ...right, render: num },
    {
      title: 'Rejection Rate',
      dataIndex: 'rejection_rate_percent',
      ...right,
      render: (v: number) => (
        <Tag color={v > 10 ? 'red' : v > 3 ? 'orange' : 'green'}>{pct(v)}</Tag>
      ),
    },
  ],
}

const poStatus: ReportDefinition<ApiPurchaseOrderStatusReportRow> = {
  slug: 'po-status',
  title: 'Purchase Order Status',
  description: 'Ordered versus received quantity per purchase order line.',
  category: 'purchase',
  permission: 'read report-po-status',
  filters: ['supplier_id', 'status', 'from_date', 'to_date'],
  columns: [
    { title: 'PO No', dataIndex: 'po_number' },
    { title: 'Date', dataIndex: 'po_date', render: dash },
    { title: 'Supplier', dataIndex: 'supplier', render: dash },
    { title: 'Status', dataIndex: 'status', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Lines',
      dataIndex: 'lines',
      ...right,
      render: (lines: unknown[]) => lines?.length ?? 0,
    },
  ],
  expand: {
    key: 'lines',
    columns: [
      { title: 'Item Code', dataIndex: 'item_code' },
      { title: 'Item', dataIndex: 'item_name' },
      { title: 'Ordered', dataIndex: 'ordered_qty', ...right, render: num },
      { title: 'Received', dataIndex: 'received_qty', ...right, render: num },
      { title: 'Pending', dataIndex: 'pending_qty', ...right, render: num },
    ],
  },
}

// ── Quality ──────────────────────────────────────────────────────────────────

const inspectionSummary: ReportDefinition<ApiInspectionSummaryReportRow> = {
  slug: 'inspection-summary',
  title: 'Inspection Summary',
  description: 'Pass/fail rate by inspection parameter.',
  category: 'quality',
  permission: 'read report-inspection-summary',
  filters: ['from_date', 'to_date'],
  columns: [
    { title: 'Parameter', dataIndex: 'parameter_name' },
    { title: 'Readings', dataIndex: 'total_readings', ...right, render: num },
    { title: 'Pass', dataIndex: 'pass_count', ...right, render: num },
    { title: 'Fail', dataIndex: 'fail_count', ...right, render: num },
    {
      title: 'Pass Rate',
      dataIndex: 'pass_rate_percent',
      ...right,
      render: (v: number) => (
        <Tag color={v >= 95 ? 'green' : v >= 80 ? 'orange' : 'red'}>{pct(v)}</Tag>
      ),
    },
  ],
}

const customerComplaints: ReportDefinition<ApiCustomerComplaintsReportRow> = {
  slug: 'customer-complaints',
  title: 'Customer Complaints',
  description: 'Complaints by customer and status, with resolution activity.',
  category: 'quality',
  permission: 'read report-customer-complaints',
  filters: ['party_id', 'status', 'from_date', 'to_date'],
  columns: [
    { title: 'Complaint No', dataIndex: 'complaint_number' },
    { title: 'Date', dataIndex: 'complaint_date', render: dash },
    { title: 'Customer', dataIndex: 'party', render: dash },
    { title: 'Item', dataIndex: 'item_name', render: dash },
    { title: 'Returned Qty', dataIndex: 'returned_qty', ...right, render: num },
    { title: 'Status', dataIndex: 'status_label', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Resolutions', dataIndex: 'resolutions_count', ...right, render: num },
    { title: 'Last Resolved', dataIndex: 'last_resolved_at', render: dash },
  ],
}

// ── Cross-cutting ────────────────────────────────────────────────────────────

const auditLog: ReportDefinition<ApiAuditLogReportRow> = {
  slug: 'audit-log',
  title: 'Audit / Activity Log',
  description: 'Who created or modified which document, and when.',
  category: 'system',
  permission: 'read report-audit-log',
  filters: ['document_type', 'from_date', 'to_date'],
  columns: [
    { title: 'Document Type', dataIndex: 'document_type' },
    { title: 'Document No', dataIndex: 'document_number', render: dash },
    { title: 'Created By', dataIndex: 'created_by_name', render: dash },
    { title: 'Created At', dataIndex: 'created_at', render: dash },
    { title: 'Updated By', dataIndex: 'updated_by_name', render: dash },
    { title: 'Updated At', dataIndex: 'updated_at', render: dash },
  ],
}

export const REPORTS: RegisteredReport[] = [
  defineReport(salesRegister),
  defineReport(orderFulfillment),
  defineReport(customerSalesSummary),
  defineReport(salesFunnel),
  defineReport(stockLedger),
  defineReport(stockValuation),
  defineReport(reorder),
  defineReport(stockTransfer),
  defineReport(openingVsCurrent),
  defineReport(jobCardStatus),
  defineReport(productionOutput),
  defineReport(rejections),
  defineReport(outsourceChallans),
  defineReport(grnRegister),
  defineReport(supplierPerformance),
  defineReport(poStatus),
  defineReport(inspectionSummary),
  defineReport(customerComplaints),
  defineReport(auditLog),
]

export const REPORT_CATEGORIES: { key: ReportCategory; label: string }[] = [
  { key: 'purchase', label: 'Purchase' },
  { key: 'sales', label: 'Sales' },
  { key: 'stock', label: 'Store' },
  { key: 'production', label: 'Production' },
  { key: 'quality', label: 'Quality' },
  { key: 'system', label: 'System' },
]

export function findReport(slug: string | undefined) {
  return REPORTS.find(r => r.slug === slug)
}
