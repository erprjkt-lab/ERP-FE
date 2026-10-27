import { UploadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Col, Form, Row, Upload } from 'antd'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { useCustomers } from '@/modules/masters/hooks/useCustomers'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { CustomerComplaint } from '@/types/quality'
import {
  useCreateCustomerComplaint,
  useUpdateCustomerComplaint,
} from '../hooks/useCustomerComplaints'
import { deferMount } from '@/components/ui/deferMount'

const DATE_FORMAT = 'YYYY-MM-DD'

export interface CustomerComplaintFormDrawerProps {
  open: boolean
  complaint?: CustomerComplaint
  onClose: () => void
}

/** Picks the File back off antd's Upload event — Form stores the fileList. */
const fileFromEvent = (event: unknown) =>
  Array.isArray(event) ? event : ((event as { fileList?: UploadFile[] })?.fileList ?? [])

const CustomerComplaintFormDrawerInner: FC<CustomerComplaintFormDrawerProps> = ({
  open,
  complaint,
  onClose,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!complaint

  const { data: customers = [] } = useCustomers()
  const { data: locations = [] } = useLocations()
  const { data: items, loadMore: loadMoreItems, hasMore: hasMoreItems } = useProcurementItems(false)
  const { mutateAsync: createComplaint, isPending: creating } = useCreateCustomerComplaint()
  const { mutateAsync: updateComplaint, isPending: updating } = useUpdateCustomerComplaint()

  // Watched so the stock-return fields only appear when they are actually used —
  // ERP-BE credits stock back in only when product_returned is true.
  const productReturned = Form.useWatch('productReturned', form)

  useEffect(() => {
    if (!open) return
    if (complaint) {
      form.setFieldsValue({
        complaintDate: dayjs(complaint.complaintDate),
        partyId: complaint.partyId,
        itemId: complaint.itemId,
        description: complaint.description,
        productReturned: complaint.productReturned,
        returnLocationId: complaint.returnLocationId ?? undefined,
        batchNo: complaint.batchNo,
        returnedQty: complaint.returnedQty ?? undefined,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ complaintDate: dayjs(), productReturned: false })
    }
  }, [open, complaint, form])

  const handleSubmit = async () => {
    let values: Record<string, unknown>
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const returned = Boolean(values.productReturned)

    try {
      if (complaint) {
        // ERP-BE's update() validates only these three — everything else is
        // fixed once the complaint (and any stock movement it made) exists.
        await updateComplaint({
          id: complaint.id,
          payload: {
            complaint_date: (values.complaintDate as dayjs.Dayjs).format(DATE_FORMAT),
            complaint_description: values.description as string,
          },
        })
      } else {
        await createComplaint({
          complaint_date: (values.complaintDate as dayjs.Dayjs).format(DATE_FORMAT),
          party_id: Number(values.partyId),
          item_id: Number(values.itemId),
          complaint_description: values.description as string,
          product_returned: returned,
          // Only meaningful alongside a return; sending them otherwise would imply
          // a stock movement ERP-BE is not going to make.
          return_location_id: returned ? Number(values.returnLocationId) : null,
          batch_no: returned ? ((values.batchNo as string) ?? null) : null,
          returned_qty: returned ? Number(values.returnedQty) : null,
          defect_image:
            (values.defectImage as UploadFile[] | undefined)?.[0]?.originFileObj ?? null,
        })
      }
      message.success(`Complaint ${isEdit ? 'updated' : 'recorded'} successfully`)
      onClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const locationOptions = locations
    .filter(l => l.isActive)
    .map(l => ({ label: `${l.code} — ${l.name}`, value: l.id }))

  return (
    <FormDrawer
      title={isEdit ? 'Edit Complaint' : 'Record Customer Complaint'}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      width={680}
    >
      <Form form={form} layout="vertical">
        <FormSection title="Complaint">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <FormField
                label="Complaint Date"
                name="complaintDate"
                fieldType="date"
                rules={[{ required: true, message: 'Complaint date is required' }]}
              />
            </Col>
            {!isEdit && (
              <Col xs={24} sm={12}>
                <FormField
                  label="Customer"
                  name="partyId"
                  fieldType="select"
                  placeholder="Select customer"
                  options={customerOptions}
                  rules={[{ required: true, message: 'Customer is required' }]}
                />
              </Col>
            )}
            {!isEdit && (
              <Col xs={24} sm={12}>
                <FormField
                  label="Item"
                  name="itemId"
                  fieldType="select"
                  placeholder="Select item"
                  options={itemOptions}
                  hasMore={hasMoreItems}
                  onLoadMore={loadMoreItems}
                  rules={[{ required: true, message: 'Item is required' }]}
                />
              </Col>
            )}
            <Col xs={24}>
              <FormField
                label="Complaint Description"
                name="description"
                fieldType="textarea"
                rules={[{ required: true, message: 'Description is required' }]}
              />
            </Col>
            {!isEdit && (
              <Col xs={24}>
                <Form.Item
                  label="Defect Image"
                  name="defectImage"
                  valuePropName="fileList"
                  getValueFromEvent={fileFromEvent}
                  extra="JPG or PNG, up to 5 MB."
                >
                  <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    accept="image/*"
                    listType="picture"
                  >
                    <Button icon={<UploadOutlined />}>Select image</Button>
                  </Upload>
                </Form.Item>
              </Col>
            )}
          </Row>
        </FormSection>

        {!isEdit && (
          <FormSection title="Return">
            <Row gutter={16}>
              <Col xs={24}>
                <FormField
                  label="Product returned by customer"
                  name="productReturned"
                  fieldType="switch"
                  extra="Turning this on credits the returned quantity back into stock."
                />
              </Col>
              {productReturned && (
                <>
                  <Col xs={24} sm={12}>
                    <FormField
                      label="Return Location"
                      name="returnLocationId"
                      fieldType="select"
                      placeholder="Select location"
                      options={locationOptions}
                      rules={[{ required: true, message: 'Return location is required' }]}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <FormField
                      label="Returned Qty"
                      name="returnedQty"
                      fieldType="number"
                      rules={[
                        { required: true, message: 'Returned qty is required' },
                        // ERP-BE validates returned_qty with gt:0.
                        {
                          type: 'number',
                          min: 0.001,
                          message: 'Returned qty must be greater than 0',
                        },
                      ]}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <FormField label="Batch No" name="batchNo" />
                  </Col>
                </>
              )}
            </Row>
          </FormSection>
        )}

        {isEdit && (
          <Alert
            type="info"
            showIcon
            message="Customer, item, defect image and return details are fixed once a complaint is recorded — only the date and description can be edited."
          />
        )}
      </Form>
    </FormDrawer>
  )
}

export const CustomerComplaintFormDrawer = deferMount(CustomerComplaintFormDrawerInner)
