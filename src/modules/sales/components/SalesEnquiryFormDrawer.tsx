import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import {
  useCreateSalesEnquiry,
  useSalesEnquiry,
  useUpdateSalesEnquiry,
} from '../hooks/useSalesEnquiries'
import type { SalesEnquiryItemInput } from '../hooks/useSalesEnquiries'

interface ItemRowValues {
  itemId: string
  qty: number
  itemRemark?: string
}

interface EnquiryFormValues {
  enquiryDate: dayjs.Dayjs
  partyId: string
  refBy?: string
  remarks?: string
  items: ItemRowValues[]
}

export interface SalesEnquiryFormDrawerProps {
  open: boolean
  onClose: () => void
  enquiryId?: string
}

export const SalesEnquiryFormDrawer: FC<SalesEnquiryFormDrawerProps> = ({
  open,
  onClose,
  enquiryId,
}) => {
  const isEdit = !!enquiryId
  const { message } = App.useApp()
  const [form] = Form.useForm<EnquiryFormValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: existing } = useSalesEnquiry(enquiryId)
  const { mutateAsync: create, isPending: creating } = useCreateSalesEnquiry()
  const { mutateAsync: update, isPending: updating } = useUpdateSalesEnquiry()

  // Backend only allows edits while the enquiry is still OPEN.
  const isLocked = isEdit && !!existing && existing.status !== 'OPEN'

  const customerOptions = customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))

  useEffect(() => {
    if (!open) return
    if (existing) {
      form.setFieldsValue({
        enquiryDate: dayjs(existing.enquiryDate),
        partyId: String(existing.partyId),
        refBy: existing.refBy ?? undefined,
        remarks: existing.remarks ?? undefined,
        items: existing.items.map(item => ({
          itemId: String(item.itemId),
          qty: item.qty,
          itemRemark: item.itemRemark ?? undefined,
        })),
      })
    } else {
      form.resetFields()
    }
  }, [open, existing, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    if (isLocked) return
    const values = await form.validateFields()

    const itemRows: SalesEnquiryItemInput[] = values.items.map(row => {
      const item = items.find(i => i.id === row.itemId)
      // Fields no longer on the form keep whatever was saved before, instead of being nulled.
      const prev = existing?.items.find(i => String(i.itemId) === row.itemId)
      return {
        itemId: row.itemId,
        uomId: item?.uomId ?? null,
        qty: row.qty,
        annualVolume: prev?.annualVolume ?? null,
        drawingNo: prev?.drawingNo ?? null,
        processRoute: prev?.processRoute ?? null,
        fgWeight: prev?.fgWeight ?? null,
        grossWeight: prev?.grossWeight ?? null,
        drawingReceived: prev?.drawingReceived ?? false,
        feasibleStatus: prev?.feasibleStatus ?? 'PENDING',
        itemRemark: row.itemRemark ?? null,
      }
    })

    const input = {
      enquiryDate: values.enquiryDate.format('YYYY-MM-DD'),
      partyId: values.partyId,
      refBy: values.refBy ?? null,
      // Not on the form anymore; keep any value saved earlier.
      refNo: existing?.refNo ?? null,
      remarks: values.remarks ?? null,
      items: itemRows,
    }

    try {
      if (isEdit) await update({ id: enquiryId, input })
      else await create(input)
      message.success(isEdit ? 'Sales enquiry updated' : 'Sales enquiry created')
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? `Edit ${existing?.enquiryNumber ?? 'Enquiry'}` : 'New Sales Enquiry'}
      open={open}
      width={840}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Save Changes' : 'Save Enquiry'}
      hideFooter={isLocked}
    >
      {isLocked ? (
        <Typography.Text>
          This enquiry can no longer be edited — it has already been quoted or closed.
        </Typography.Text>
      ) : (
        <Form form={form} layout="vertical" initialValues={{ enquiryDate: dayjs(), items: [{}] }}>
          <FormSection title="Enquiry Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Enquiry Date"
                  name="enquiryDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={10}>
                <Form.Item
                  label="Customer"
                  name="partyId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    placeholder="Select customer"
                    options={customerOptions}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Ref By" name="refBy">
                  <Input placeholder="Enquired by" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
          </FormSection>

          <FormSection title="Items">
            <Form.List
              name="items"
              rules={[
                {
                  validator: async (_, v) => {
                    if (!v || v.length === 0) throw new Error('Add at least one item')
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(field => (
                    <div
                      key={field.key}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 90px 1fr 32px',
                        gap: '0 8px',
                        alignItems: 'start',
                      }}
                    >
                      <Form.Item
                        name={[field.name, 'itemId']}
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <Select
                          placeholder="Select item"
                          options={itemOptions}
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.label ?? '')
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'qty']}
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <InputNumber placeholder="Qty" min={0.0001} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'itemRemark']}>
                        <Input placeholder="Remark" />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    Add Item
                  </Button>
                </>
              )}
            </Form.List>
          </FormSection>
        </Form>
      )}
    </FormDrawer>
  )
}
