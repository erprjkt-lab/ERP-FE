import { useQueryClient } from '@tanstack/react-query'
import { App, DatePicker, Form, Input, InputNumber, Radio, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import type { PurchaseEnquiryStatus } from '@/types/procurement'
import { SUPPLIER_STATUS_LABELS } from '../constants'
import { usePurchaseEnquiry } from '../hooks/usePurchaseEnquiries'
import {
  useRecordSupplierQuotation,
  useSupplierQuotationByPeSupplier,
} from '../hooks/useSupplierQuotations'
import type { SupplierQuotationItemInput } from '../hooks/useSupplierQuotations'
import { getErrorMessage } from '@/api/client'

interface ItemRowValues {
  quotedQty: number
  rate: number
  discountPercent: number
  taxPercent: number
  deliveryDate?: dayjs.Dayjs
  remarks?: string
}

// Mirrors ERP-BE's PurchaseEnquiry::LOCKED_STATUSES — SupplierQuotationService::update
// rejects edits once the enquiry is here ("Quotations cannot be edited once a
// supplier has been selected").
const LOCKED_STATUSES: PurchaseEnquiryStatus[] = [
  'SUPPLIER_SELECTED',
  'PO_CREATED',
  'CLOSED',
  'CANCELLED',
]

export interface SupplierQuotationFormDrawerProps {
  open: boolean
  onClose: () => void
  enquiryId?: string
  /** Which supplier's tab is active on open. Defaults to the first supplier. */
  initialPeSupplierId?: string
}

export const SupplierQuotationFormDrawer: FC<SupplierQuotationFormDrawerProps> = ({
  open,
  onClose,
  enquiryId,
  initialPeSupplierId,
}) => {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  // Only set once the user manually switches tabs — cleared on close (see
  // handleClose) so the next open always falls back to initialPeSupplierId /
  // the first supplier rather than whatever tab was left selected last time.
  const [manualPeSupplierId, setManualPeSupplierId] = useState<string>()

  // This component is a permanently-mounted sibling of the page (visibility
  // toggled by `open`, not mount/unmount), so TanStack Query's normal
  // refetch-on-mount never fires on reopen — force a fresh fetch every time
  // the drawer opens instead of trusting whatever's already cached, since
  // another session/tab may have recorded a response since we last looked.
  useEffect(() => {
    if (!open || !enquiryId) return
    queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', enquiryId] })
    queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', enquiryId, 'quotations'] })
  }, [open, enquiryId, queryClient])

  const { data: enquiry } = usePurchaseEnquiry(enquiryId)
  const activePeSupplierId = manualPeSupplierId ?? initialPeSupplierId ?? enquiry?.suppliers[0]?.id
  const { data: existingQuotation } = useSupplierQuotationByPeSupplier(
    enquiryId,
    activePeSupplierId,
  )
  const { mutateAsync: recordQuotation, isPending: saving } = useRecordSupplierQuotation()

  const peSupplier = enquiry?.suppliers.find(sup => sup.id === activePeSupplierId)
  const isLocked = !!enquiry && LOCKED_STATUSES.includes(enquiry.status)

  useEffect(() => {
    if (!open || !enquiry || !activePeSupplierId) return
    form.setFieldsValue({
      quotationNumber: existingQuotation?.quotationNumber,
      quotationDate: existingQuotation ? dayjs(existingQuotation.quotationDate) : dayjs(),
      validUntil: existingQuotation?.validUntil ? dayjs(existingQuotation.validUntil) : undefined,
      paymentTerms: existingQuotation?.paymentTerms,
      deliveryTerms: existingQuotation?.deliveryTerms,
      freightAmount: existingQuotation?.freightAmount ?? 0,
      otherCharges: existingQuotation?.otherCharges ?? 0,
      remarks: existingQuotation?.remarks,
      items: enquiry.items.map(peItem => {
        const existingItem = existingQuotation?.items.find(
          i => i.purchaseEnquiryItemId === peItem.id,
        )
        return {
          quotedQty: existingItem?.quotedQty ?? peItem.requiredQty,
          rate: existingItem?.rate ?? 0,
          discountPercent: existingItem?.discountPercent ?? 0,
          taxPercent: existingItem?.taxPercent ?? 0,
          deliveryDate: existingItem?.deliveryDate ? dayjs(existingItem.deliveryDate) : undefined,
          remarks: existingItem?.remarks,
        }
      }),
    })
    // Depend on the serialized record, not just its id — editing a quotation
    // keeps the same id, so keying off `.id` alone meant reopening after an
    // update never re-ran this effect and the form kept showing pre-edit
    // values even once the refetch (above) brought the fresh data in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activePeSupplierId, JSON.stringify(existingQuotation), enquiry?.id, form])

  const handleClose = () => {
    form.resetFields()
    setManualPeSupplierId(undefined)
    onClose()
  }

  const handleSubmit = async () => {
    if (!enquiry || !peSupplier || isLocked) return
    let values: {
      quotationNumber: string
      quotationDate: dayjs.Dayjs
      validUntil?: dayjs.Dayjs
      paymentTerms?: string
      deliveryTerms?: string
      freightAmount: number
      otherCharges: number
      remarks?: string
      items: ItemRowValues[]
    }
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const items: SupplierQuotationItemInput[] = enquiry.items.map((peItem, index) => {
      const row = values.items[index]
      return {
        purchaseEnquiryItemId: peItem.id,
        itemId: peItem.itemId,
        itemName: peItem.itemName,
        quotedQty: row.quotedQty,
        uomId: peItem.uomId,
        uomName: peItem.uomName,
        rate: row.rate,
        discountPercent: row.discountPercent,
        taxPercent: row.taxPercent,
        deliveryDate: row.deliveryDate ? row.deliveryDate.format('YYYY-MM-DD') : null,
        remarks: row.remarks,
      }
    })

    try {
      await recordQuotation({
        purchaseEnquiryId: enquiry.id,
        purchaseEnquirySupplierId: peSupplier.id,
        quotationNumber: values.quotationNumber,
        quotationDate: values.quotationDate.format('YYYY-MM-DD'),
        validUntil: values.validUntil ? values.validUntil.format('YYYY-MM-DD') : null,
        paymentTerms: values.paymentTerms,
        deliveryTerms: values.deliveryTerms,
        freightAmount: values.freightAmount ?? 0,
        otherCharges: values.otherCharges ?? 0,
        remarks: values.remarks,
        items,
      })
      message.success('Supplier quotation recorded')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const supplierLabel = peSupplier?.supplierName ?? peSupplier?.supplierId ?? ''

  return (
    <FormDrawer
      title={`${existingQuotation ? 'Edit' : 'Record'} Quotation${enquiry ? ` — ${enquiry.enquiryNumber}` : ''}`}
      open={open}
      width={960}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={saving}
      submitText={
        existingQuotation
          ? `Update Quotation — ${supplierLabel}`
          : `Record Quotation — ${supplierLabel}`
      }
      hideFooter={isLocked}
    >
      {isLocked ? (
        <Typography.Text>
          Quotations can no longer be edited — a supplier has already been selected for this
          enquiry.
        </Typography.Text>
      ) : (
        <>
          {(enquiry?.suppliers.length ?? 0) > 1 && (
            <Radio.Group
              value={activePeSupplierId}
              onChange={e => setManualPeSupplierId(e.target.value)}
              buttonStyle="solid"
              style={{ marginBottom: 16 }}
            >
              {enquiry?.suppliers.map(sup => (
                <Radio.Button key={sup.id} value={sup.id}>
                  {sup.supplierName ?? sup.supplierId} —{' '}
                  {SUPPLIER_STATUS_LABELS[sup.supplierStatus]}
                </Radio.Button>
              ))}
            </Radio.Group>
          )}
          <Form form={form} layout="vertical">
            <FormSection title="Quotation Details">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <Form.Item
                  label="Quotation Number"
                  name="quotationNumber"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Quotation Date"
                  name="quotationDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Valid Until" name="validUntil">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </FormSection>

            <FormSection title="Terms & Charges">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <Form.Item label="Payment Terms" name="paymentTerms">
                  <Input />
                </Form.Item>
                <Form.Item label="Delivery Terms" name="deliveryTerms">
                  <Input />
                </Form.Item>
                <Form.Item label="Freight Amount" name="freightAmount">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Other Charges" name="otherCharges">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              <Form.Item label="Remarks" name="remarks">
                <Input.TextArea rows={2} />
              </Form.Item>
            </FormSection>

            <FormSection title="Items">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 90px 90px 90px 90px 130px 1fr',
                  gap: '0 8px',
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.45)',
                  marginBottom: 4,
                }}
              >
                <div>Item</div>
                <div>Qty</div>
                <div>Rate</div>
                <div>Disc %</div>
                <div>Tax %</div>
                <div>Delivery Date</div>
                <div>Remarks</div>
              </div>
              {(enquiry?.items ?? []).map((peItem, index) => (
                <div
                  key={peItem.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 90px 90px 90px 90px 130px 1fr',
                    gap: '0 8px',
                    alignItems: 'start',
                  }}
                >
                  <div style={{ paddingTop: 8 }}>
                    {peItem.itemName}{' '}
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>({peItem.uomName})</span>
                  </div>
                  <Form.Item name={['items', index, 'quotedQty']} rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['items', index, 'rate']} rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['items', index, 'discountPercent']}>
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['items', index, 'taxPercent']}>
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['items', index, 'deliveryDate']}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['items', index, 'remarks']}>
                    <Input />
                  </Form.Item>
                </div>
              ))}
            </FormSection>
          </Form>
        </>
      )}
    </FormDrawer>
  )
}
