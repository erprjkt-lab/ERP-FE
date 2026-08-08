import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Priority,
  PurchaseEnquiry,
  PurchaseEnquiryItem,
  PurchaseEnquiryStatus,
  PurchaseEnquirySupplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  SupplierQuotation,
  SupplierQuotationItem,
} from '@/types/procurement'
import { generateId, generateSequentialCode } from '../utils/generateCode'

const nowIso = () => new Date().toISOString()
const round2 = (n: number) => Math.round(n * 100) / 100

function computeLineAmounts(
  qty: number,
  rate: number,
  discountPercent: number | null | undefined,
  taxPercent: number | null | undefined,
) {
  const gross = (qty || 0) * (rate || 0)
  const discountAmount = round2((gross * (discountPercent || 0)) / 100)
  const taxable = gross - discountAmount
  const taxAmount = round2((taxable * (taxPercent || 0)) / 100)
  const lineTotal = round2(taxable + taxAmount)
  return { discountAmount, taxAmount, lineTotal }
}

export interface ListFilters {
  search: string
  status: string | null
}
const DEFAULT_FILTERS: ListFilters = { search: '', status: null }

// ---------- Input types (what forms/hooks pass in) ----------
export type PurchaseRequisitionItemInput = Omit<PurchaseRequisitionItem, 'id' | 'pendingQty'>
export type PurchaseRequisitionInput = Omit<
  PurchaseRequisition,
  | 'id'
  | 'requisitionNumber'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'items'
  | 'approvedBy'
  | 'approvedAt'
  | 'rejectionReason'
  | 'createdBy'
> & { items: PurchaseRequisitionItemInput[] }

export type PurchaseEnquiryItemInput = Omit<PurchaseEnquiryItem, 'id'>
export interface PurchaseEnquirySupplierInput {
  supplierId: string
  supplierCode?: string
  supplierName?: string
}
export type PurchaseEnquiryManualInput = Omit<
  PurchaseEnquiry,
  | 'id'
  | 'enquiryNumber'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'items'
  | 'suppliers'
  | 'createdBy'
> & { items: PurchaseEnquiryItemInput[]; suppliers: PurchaseEnquirySupplierInput[] }

export interface CreateEnquiryFromRequisitionsInput {
  requisitionIds: string[]
  enquiryDate: string
  enquiryDueDate?: string | null
  priority: Priority
  remarks?: string
  suppliers: PurchaseEnquirySupplierInput[]
}

export type SupplierQuotationItemInput = Omit<
  SupplierQuotationItem,
  'id' | 'discountAmount' | 'taxAmount' | 'lineTotal'
>
export type SupplierQuotationInput = Omit<
  SupplierQuotation,
  'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'items' | 'createdBy'
> & { items: SupplierQuotationItemInput[] }

export type PurchaseOrderItemInput = Omit<
  PurchaseOrderItem,
  'id' | 'discountAmount' | 'taxAmount' | 'lineTotal'
>
export type PurchaseOrderDirectInput = Omit<
  PurchaseOrder,
  | 'id'
  | 'poNumber'
  | 'createdAt'
  | 'updatedAt'
  | 'status'
  | 'items'
  | 'taxableAmount'
  | 'taxAmount'
  | 'netAmount'
  | 'purchaseEnquiryId'
  | 'purchaseEnquirySupplierId'
  | 'createdBy'
> & { items: PurchaseOrderItemInput[] }

type FilterKey = 'requisition' | 'enquiry' | 'quotation' | 'order'

interface ProcurementState {
  purchaseRequisitions: PurchaseRequisition[]
  purchaseEnquiries: PurchaseEnquiry[]
  supplierQuotations: SupplierQuotation[]
  purchaseOrders: PurchaseOrder[]

  requisitionFilters: ListFilters
  enquiryFilters: ListFilters
  quotationFilters: ListFilters
  orderFilters: ListFilters
  setFilter: (list: FilterKey, key: 'search' | 'status', value: string | null) => void
  resetFilter: (list: FilterKey) => void

  createPurchaseRequisition: (
    input: PurchaseRequisitionInput,
    createdBy: string,
  ) => PurchaseRequisition
  updatePurchaseRequisition: (id: string, input: Partial<PurchaseRequisitionInput>) => void
  submitRequisitionForApproval: (id: string) => void
  approveRequisition: (id: string, approvedBy: string) => void
  rejectRequisition: (id: string, approvedBy: string, reason: string) => void
  deletePurchaseRequisition: (id: string) => void

  createPurchaseEnquiryManual: (
    input: PurchaseEnquiryManualInput,
    createdBy: string,
  ) => PurchaseEnquiry
  createPurchaseEnquiryFromRequisitions: (
    input: CreateEnquiryFromRequisitionsInput,
    createdBy: string,
  ) => PurchaseEnquiry
  addSupplierToEnquiry: (enquiryId: string, supplier: PurchaseEnquirySupplierInput) => void
  removeSupplierFromEnquiry: (enquiryId: string, peSupplierId: string) => void
  sendPurchaseEnquiry: (id: string) => void
  deletePurchaseEnquiry: (id: string) => void

  recordSupplierQuotation: (input: SupplierQuotationInput, createdBy: string) => SupplierQuotation

  selectSupplierForEnquiry: (enquiryId: string, peSupplierId: string) => void
  createPurchaseOrderFromEnquiry: (enquiryId: string, opts?: { force?: boolean }) => PurchaseOrder
  createPurchaseOrderDirect: (input: PurchaseOrderDirectInput, createdBy: string) => PurchaseOrder
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void
  deletePurchaseOrder: (id: string) => void
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    set => ({
      purchaseRequisitions: [],
      purchaseEnquiries: [],
      supplierQuotations: [],
      purchaseOrders: [],

      requisitionFilters: DEFAULT_FILTERS,
      enquiryFilters: DEFAULT_FILTERS,
      quotationFilters: DEFAULT_FILTERS,
      orderFilters: DEFAULT_FILTERS,

      setFilter: (list, key, value) =>
        set(s => {
          switch (list) {
            case 'requisition':
              return { requisitionFilters: { ...s.requisitionFilters, [key]: value } }
            case 'enquiry':
              return { enquiryFilters: { ...s.enquiryFilters, [key]: value } }
            case 'quotation':
              return { quotationFilters: { ...s.quotationFilters, [key]: value } }
            case 'order':
              return { orderFilters: { ...s.orderFilters, [key]: value } }
          }
        }),
      resetFilter: list => {
        switch (list) {
          case 'requisition':
            return set({ requisitionFilters: DEFAULT_FILTERS })
          case 'enquiry':
            return set({ enquiryFilters: DEFAULT_FILTERS })
          case 'quotation':
            return set({ quotationFilters: DEFAULT_FILTERS })
          case 'order':
            return set({ orderFilters: DEFAULT_FILTERS })
        }
      },

      createPurchaseRequisition: (input, createdBy) => {
        let record!: PurchaseRequisition
        set(s => {
          const items: PurchaseRequisitionItem[] = input.items.map(item => ({
            ...item,
            id: generateId('pritem'),
            pendingQty: item.requiredQty,
          }))
          record = {
            id: generateId('requisition'),
            requisitionNumber: generateSequentialCode(
              s.purchaseRequisitions,
              'PR',
              pr => pr.requisitionNumber,
            ),
            requisitionDate: input.requisitionDate,
            departmentId: input.departmentId,
            departmentName: input.departmentName,
            priority: input.priority,
            status: 'DRAFT',
            remarks: input.remarks,
            items,
            createdBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          return { purchaseRequisitions: [...s.purchaseRequisitions, record] }
        })
        return record
      },

      updatePurchaseRequisition: (id, input) =>
        set(s => ({
          purchaseRequisitions: s.purchaseRequisitions.map(pr => {
            if (pr.id !== id) return pr
            if (pr.status !== 'DRAFT') throw new Error('Only DRAFT requisitions can be edited')
            const items = input.items
              ? input.items.map(item => ({
                  ...item,
                  id: generateId('pritem'),
                  pendingQty: item.requiredQty,
                }))
              : pr.items
            return { ...pr, ...input, items, updatedAt: nowIso() }
          }),
        })),

      submitRequisitionForApproval: id =>
        set(s => ({
          purchaseRequisitions: s.purchaseRequisitions.map(pr =>
            pr.id === id && pr.status === 'DRAFT'
              ? { ...pr, status: 'PENDING_APPROVAL', updatedAt: nowIso() }
              : pr,
          ),
        })),

      approveRequisition: (id, approvedBy) =>
        set(s => ({
          purchaseRequisitions: s.purchaseRequisitions.map(pr =>
            pr.id === id
              ? { ...pr, status: 'APPROVED', approvedBy, approvedAt: nowIso(), updatedAt: nowIso() }
              : pr,
          ),
        })),

      rejectRequisition: (id, approvedBy, reason) =>
        set(s => ({
          purchaseRequisitions: s.purchaseRequisitions.map(pr =>
            pr.id === id
              ? {
                  ...pr,
                  status: 'REJECTED',
                  approvedBy,
                  approvedAt: nowIso(),
                  rejectionReason: reason,
                  updatedAt: nowIso(),
                }
              : pr,
          ),
        })),

      deletePurchaseRequisition: id =>
        set(s => ({ purchaseRequisitions: s.purchaseRequisitions.filter(pr => pr.id !== id) })),

      createPurchaseEnquiryManual: (input, createdBy) => {
        let record!: PurchaseEnquiry
        set(s => {
          record = {
            id: generateId('enquiry'),
            enquiryNumber: generateSequentialCode(s.purchaseEnquiries, 'PE', e => e.enquiryNumber),
            enquiryDate: input.enquiryDate,
            enquiryDueDate: input.enquiryDueDate ?? null,
            priority: input.priority,
            status: 'DRAFT',
            remarks: input.remarks,
            items: input.items.map(item => ({ ...item, id: generateId('peitem') })),
            suppliers: input.suppliers.map(sup => ({
              id: generateId('pesupplier'),
              supplierStatus: 'PENDING',
              ...sup,
            })),
            createdBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          return { purchaseEnquiries: [...s.purchaseEnquiries, record] }
        })
        return record
      },

      createPurchaseEnquiryFromRequisitions: (input, createdBy) => {
        let record!: PurchaseEnquiry
        set(s => {
          const prs = s.purchaseRequisitions.filter(pr => input.requisitionIds.includes(pr.id))
          if (prs.length === 0) throw new Error('Select at least one requisition')
          const notApproved = prs.find(pr => pr.status !== 'APPROVED')
          if (notApproved) {
            throw new Error(`Requisition ${notApproved.requisitionNumber} is not APPROVED`)
          }

          const peItems: PurchaseEnquiryItem[] = []
          const purchaseRequisitions = s.purchaseRequisitions.map(pr => {
            if (!input.requisitionIds.includes(pr.id)) return pr
            const items = pr.items.map(item => {
              if (item.pendingQty <= 0) return item
              peItems.push({
                id: generateId('peitem'),
                purchaseRequisitionItemId: item.id,
                sourcePrNumber: pr.requisitionNumber,
                itemId: item.itemId,
                itemCode: item.itemCode,
                itemName: item.itemName,
                itemDescription: item.itemDescription,
                requiredQty: item.pendingQty,
                uomId: item.uomId,
                uomName: item.uomName,
                requiredDate: item.requiredDate,
              })
              return { ...item, pendingQty: 0 }
            })
            return { ...pr, items, updatedAt: nowIso() }
          })

          if (peItems.length === 0) {
            throw new Error('Selected requisitions have no pending items left to pull')
          }

          record = {
            id: generateId('enquiry'),
            enquiryNumber: generateSequentialCode(s.purchaseEnquiries, 'PE', e => e.enquiryNumber),
            enquiryDate: input.enquiryDate,
            enquiryDueDate: input.enquiryDueDate ?? null,
            priority: input.priority,
            status: 'DRAFT',
            remarks: input.remarks,
            items: peItems,
            suppliers: input.suppliers.map(sup => ({
              id: generateId('pesupplier'),
              supplierStatus: 'PENDING',
              ...sup,
            })),
            createdBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }

          return {
            purchaseRequisitions,
            purchaseEnquiries: [...s.purchaseEnquiries, record],
          }
        })
        return record
      },

      addSupplierToEnquiry: (enquiryId, supplier) =>
        set(s => ({
          purchaseEnquiries: s.purchaseEnquiries.map(e => {
            if (e.id !== enquiryId) return e
            if (e.status !== 'DRAFT') throw new Error('Suppliers can only be added while DRAFT')
            const newSupplier: PurchaseEnquirySupplier = {
              id: generateId('pesupplier'),
              supplierStatus: 'PENDING',
              ...supplier,
            }
            return { ...e, suppliers: [...e.suppliers, newSupplier], updatedAt: nowIso() }
          }),
        })),

      removeSupplierFromEnquiry: (enquiryId, peSupplierId) =>
        set(s => ({
          purchaseEnquiries: s.purchaseEnquiries.map(e => {
            if (e.id !== enquiryId) return e
            if (e.status !== 'DRAFT') throw new Error('Suppliers can only be removed while DRAFT')
            return {
              ...e,
              suppliers: e.suppliers.filter(sup => sup.id !== peSupplierId),
              updatedAt: nowIso(),
            }
          }),
        })),

      sendPurchaseEnquiry: id =>
        set(s => {
          const pe = s.purchaseEnquiries.find(e => e.id === id)
          if (!pe) throw new Error('Purchase enquiry not found')
          if (pe.status !== 'DRAFT') throw new Error('Only DRAFT enquiries can be sent')
          if (pe.items.length === 0) throw new Error('Add at least one item before sending')
          if (pe.suppliers.length === 0) throw new Error('Add at least one supplier before sending')
          const sentAt = nowIso()
          return {
            purchaseEnquiries: s.purchaseEnquiries.map(e =>
              e.id === id
                ? {
                    ...e,
                    status: 'SENT',
                    updatedAt: sentAt,
                    suppliers: e.suppliers.map(sup => ({ ...sup, supplierStatus: 'SENT', sentAt })),
                  }
                : e,
            ),
          }
        }),

      deletePurchaseEnquiry: id =>
        set(s => ({ purchaseEnquiries: s.purchaseEnquiries.filter(e => e.id !== id) })),

      recordSupplierQuotation: (input, createdBy) => {
        let record!: SupplierQuotation
        set(s => {
          const pe = s.purchaseEnquiries.find(e => e.id === input.purchaseEnquiryId)
          if (!pe) throw new Error('Purchase enquiry not found')
          const peSupplier = pe.suppliers.find(sup => sup.id === input.purchaseEnquirySupplierId)
          if (!peSupplier) throw new Error('Supplier is not on this enquiry')

          const existing = s.supplierQuotations.find(
            q => q.purchaseEnquirySupplierId === input.purchaseEnquirySupplierId,
          )

          const items: SupplierQuotationItem[] = input.items.map(item => {
            const { discountAmount, taxAmount, lineTotal } = computeLineAmounts(
              item.quotedQty,
              item.rate,
              item.discountPercent,
              item.taxPercent,
            )
            return { ...item, id: generateId('sqitem'), discountAmount, taxAmount, lineTotal }
          })
          const totalAmount = round2(
            items.reduce((sum, item) => sum + item.lineTotal, 0) +
              input.freightAmount +
              input.otherCharges,
          )

          if (existing) {
            record = { ...existing, ...input, items, totalAmount, updatedAt: nowIso() }
          } else {
            record = {
              id: generateId('quotation'),
              ...input,
              items,
              totalAmount,
              createdBy,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            }
          }

          const responseReceivedAt = nowIso()
          const suppliers = pe.suppliers.map(sup =>
            sup.id === input.purchaseEnquirySupplierId
              ? { ...sup, supplierStatus: 'RESPONDED' as const, responseReceivedAt }
              : sup,
          )
          const respondableCount = suppliers.filter(sup => sup.supplierStatus !== 'DECLINED').length
          const respondedCount = suppliers.filter(sup => sup.supplierStatus === 'RESPONDED').length
          const nextStatus: PurchaseEnquiryStatus =
            respondableCount > 0 && respondedCount >= respondableCount
              ? 'RESPONDED'
              : 'PARTIALLY_RESPONDED'

          return {
            supplierQuotations: existing
              ? s.supplierQuotations.map(q => (q.id === existing.id ? record : q))
              : [...s.supplierQuotations, record],
            purchaseEnquiries: s.purchaseEnquiries.map(e =>
              e.id === pe.id ? { ...e, suppliers, status: nextStatus, updatedAt: nowIso() } : e,
            ),
          }
        })
        return record
      },

      selectSupplierForEnquiry: (enquiryId, peSupplierId) =>
        set(s => ({
          purchaseEnquiries: s.purchaseEnquiries.map(e =>
            e.id === enquiryId
              ? {
                  ...e,
                  status: 'SUPPLIER_SELECTED',
                  updatedAt: nowIso(),
                  suppliers: e.suppliers.map(sup => ({
                    ...sup,
                    supplierStatus: sup.id === peSupplierId ? 'SELECTED' : 'NOT_SELECTED',
                  })),
                }
              : e,
          ),
        })),

      createPurchaseOrderFromEnquiry: (enquiryId, opts) => {
        let record!: PurchaseOrder
        set(s => {
          const pe = s.purchaseEnquiries.find(e => e.id === enquiryId)
          if (!pe) throw new Error('Purchase enquiry not found')
          if (!opts?.force && s.purchaseOrders.some(po => po.purchaseEnquiryId === enquiryId)) {
            throw new Error('A purchase order already exists for this enquiry')
          }
          const selectedSupplier = pe.suppliers.find(sup => sup.supplierStatus === 'SELECTED')
          if (!selectedSupplier)
            throw new Error('Select a supplier before creating a purchase order')
          const quotation = s.supplierQuotations.find(
            q => q.purchaseEnquirySupplierId === selectedSupplier.id,
          )
          if (!quotation) throw new Error('No quotation found for the selected supplier')

          const items: PurchaseOrderItem[] = quotation.items.map(item => ({
            id: generateId('poitem'),
            supplierQuotationItemId: item.id,
            purchaseEnquiryItemId: item.purchaseEnquiryItemId,
            itemId: item.itemId,
            itemName: item.itemName,
            orderedQty: item.quotedQty,
            uomId: item.uomId,
            uomName: item.uomName,
            rate: item.rate,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            taxPercent: item.taxPercent,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
            deliveryDate: item.deliveryDate,
            remarks: item.remarks,
          }))
          const taxableAmount = round2(
            items.reduce((sum, item) => sum + item.orderedQty * item.rate - item.discountAmount, 0),
          )
          const taxAmount = round2(items.reduce((sum, item) => sum + item.taxAmount, 0))
          const netAmount = round2(
            items.reduce((sum, item) => sum + item.lineTotal, 0) +
              quotation.freightAmount +
              quotation.otherCharges,
          )

          record = {
            id: generateId('order'),
            poNumber: generateSequentialCode(s.purchaseOrders, 'PO', po => po.poNumber),
            poDate: nowIso().slice(0, 10),
            supplierId: selectedSupplier.supplierId,
            supplierName: selectedSupplier.supplierName,
            purchaseEnquiryId: pe.id,
            purchaseEnquirySupplierId: selectedSupplier.id,
            currency: quotation.currency,
            paymentTerms: quotation.paymentTerms,
            deliveryTerms: quotation.deliveryTerms,
            freightAmount: quotation.freightAmount,
            otherCharges: quotation.otherCharges,
            taxableAmount,
            taxAmount,
            netAmount,
            status: 'DRAFT',
            items,
            createdBy: pe.createdBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }

          return {
            purchaseOrders: [...s.purchaseOrders, record],
            purchaseEnquiries: s.purchaseEnquiries.map(e =>
              e.id === enquiryId ? { ...e, status: 'PO_CREATED', updatedAt: nowIso() } : e,
            ),
          }
        })
        return record
      },

      createPurchaseOrderDirect: (input, createdBy) => {
        let record!: PurchaseOrder
        set(s => {
          const items: PurchaseOrderItem[] = input.items.map(item => {
            const { discountAmount, taxAmount, lineTotal } = computeLineAmounts(
              item.orderedQty,
              item.rate,
              item.discountPercent,
              item.taxPercent,
            )
            return { ...item, id: generateId('poitem'), discountAmount, taxAmount, lineTotal }
          })
          const taxableAmount = round2(
            items.reduce((sum, item) => sum + item.orderedQty * item.rate - item.discountAmount, 0),
          )
          const taxAmount = round2(items.reduce((sum, item) => sum + item.taxAmount, 0))
          const netAmount = round2(
            items.reduce((sum, item) => sum + item.lineTotal, 0) +
              input.freightAmount +
              input.otherCharges,
          )

          record = {
            id: generateId('order'),
            poNumber: generateSequentialCode(s.purchaseOrders, 'PO', po => po.poNumber),
            poDate: input.poDate,
            supplierId: input.supplierId,
            supplierName: input.supplierName,
            purchaseEnquiryId: null,
            purchaseEnquirySupplierId: null,
            currency: input.currency,
            paymentTerms: input.paymentTerms,
            deliveryTerms: input.deliveryTerms,
            freightAmount: input.freightAmount,
            otherCharges: input.otherCharges,
            taxableAmount,
            taxAmount,
            netAmount,
            status: 'DRAFT',
            remarks: input.remarks,
            items,
            createdBy,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }

          return { purchaseOrders: [...s.purchaseOrders, record] }
        })
        return record
      },

      updatePurchaseOrderStatus: (id, status) =>
        set(s => ({
          purchaseOrders: s.purchaseOrders.map(po =>
            po.id === id ? { ...po, status, updatedAt: nowIso() } : po,
          ),
        })),

      deletePurchaseOrder: id =>
        set(s => ({ purchaseOrders: s.purchaseOrders.filter(po => po.id !== id) })),
    }),
    { name: 'erp-procurement' },
  ),
)

export const useProcurementFilters = (list: FilterKey): ListFilters =>
  useProcurementStore(s => {
    switch (list) {
      case 'requisition':
        return s.requisitionFilters
      case 'enquiry':
        return s.enquiryFilters
      case 'quotation':
        return s.quotationFilters
      case 'order':
        return s.orderFilters
    }
  })
