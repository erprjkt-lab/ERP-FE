/** Mirrors ERP-BE's CustomerComplaintResource / ComplaintResolutionResource. */

/** customer_complaints.status — 0=Open, 1=In Review, 2=Resolved, 3=Closed. */
export type ApiComplaintStatus = 0 | 1 | 2 | 3

export interface ApiComplaintResolution {
  id: number
  customer_complaint_id: number
  report_number: string
  report_document: string | null
  report_document_url: string | null
  action_taken: string
  customer_feedback_reference: string | null
  remark: string | null
  resolved_by: number | null
  resolved_by_name?: string | null
  resolved_at: string | null
  created_at: string | null
}

export interface ApiCustomerComplaint {
  id: number
  complaint_number: string
  complaint_date: string | null
  party_id: number
  party_name?: string | null
  sales_invoice_id: number | null
  invoice_number?: string | null
  item_id: number
  item_name?: string | null
  defect_image: string | null
  defect_image_url: string | null
  complaint_description: string
  product_returned: boolean
  return_location_id: number | null
  return_location_name?: string | null
  batch_no: string | null
  returned_qty: number | null
  /** Set by ERP-BE when a returned item credited stock back in. */
  stock_movement_id: number | null
  status: ApiComplaintStatus
  resolutions?: ApiComplaintResolution[]
  created_at: string | null
}

/** Sent as multipart/form-data — `defect_image` is a real file upload. */
export interface CustomerComplaintPayload {
  complaint_date: string
  party_id: number
  item_id: number
  complaint_description: string
  sales_invoice_id?: number | null
  product_returned?: boolean
  return_location_id?: number | null
  batch_no?: string | null
  returned_qty?: number | null
  defect_image?: File | null
}

export interface ComplaintResolutionPayload {
  report_number: string
  action_taken: string
  customer_feedback_reference?: string | null
  remark?: string | null
  report_document?: File | null
}
