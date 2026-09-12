import { App, Col, Descriptions, Form, Row, Select } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useItemBom } from '../hooks/useItemBom'
import { useBomRequirements, useIssueMaterial } from '../hooks/useJobCardMaterials'

export interface IssueMaterialModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  /** The finished good being produced — its BOM drives the component list. */
  itemId: string
  orderedQty: number
}

interface IssueFormValues {
  componentItemId: string
  issuedQty: number
  storeLocationId: string
  batchNo?: string
  heatNo?: string
  issueDate?: { format: (fmt: string) => string }
}

export const IssueMaterialModal: FC<IssueMaterialModalProps> = ({
  open,
  onClose,
  jobCardId,
  itemId,
  orderedQty,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<IssueFormValues>()

  const { data: bomLines = [] } = useItemBom(itemId)
  const { data: requirements = [] } = useBomRequirements(jobCardId)
  const { data: allItems = [] } = useProcurementItems()
  const { data: locations = [] } = useLocations()
  const { mutateAsync: issueMaterial, isPending } = useIssueMaterial(jobCardId)

  const componentItemId = Form.useWatch('componentItemId', form) as string | undefined

  const selectedBomLine = bomLines.find(line => line.componentItemId === componentItemId)
  const selectedRequirement = requirements.find(req => req.componentItemId === componentItemId)
  const selectedItem = allItems.find(item => item.id === componentItemId)

  // Requirement rows only exist once something has been issued, so fall back to
  // the BOM-derived plan (qty per unit x ordered qty) for the "required" figure.
  const requiredQty = selectedRequirement
    ? selectedRequirement.requiredQty
    : (selectedBomLine?.quantityPerUnit ?? 0) * orderedQty
  const issuedQty = selectedRequirement?.issuedQty ?? 0
  const remainingQty = Math.max(requiredQty - issuedQty, 0)

  useEffect(() => {
    if (componentItemId) {
      form.setFieldValue('issuedQty', remainingQty > 0 ? remainingQty : undefined)
    }
    // Re-prefill only when the chosen component changes, never while the user
    // is editing the quantity they actually want to issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentItemId])

  const componentOptions = bomLines.map(line => ({
    label: `${line.componentName} (${line.quantityPerUnit} ${line.uomName} / unit)`,
    value: line.componentItemId,
  }))

  const handleOk = async () => {
    let values: IssueFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    try {
      await issueMaterial({
        component_item_id: Number(values.componentItemId),
        store_location_id: Number(values.storeLocationId),
        issued_qty: values.issuedQty,
        batch_no: values.batchNo || undefined,
        heat_no: values.heatNo || undefined,
        issue_date: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : undefined,
      })
      message.success('Material issued successfully')
      form.resetFields()
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <Modal
      title="Issue Material"
      open={open}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      onOk={handleOk}
      confirmLoading={isPending}
      width={620}
    >
      <Form form={form} layout="vertical" initialValues={{ issueDate: dayjs() }}>
        <Form.Item
          label="Component"
          name="componentItemId"
          rules={[{ required: true, message: 'Component is required' }]}
        >
          <Select
            placeholder={bomLines.length ? 'Select component' : 'No BOM defined for this item'}
            options={componentOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {componentItemId && (
          <Descriptions size="small" column={3} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Required">{requiredQty}</Descriptions.Item>
            <Descriptions.Item label="Issued">{issuedQty}</Descriptions.Item>
            <Descriptions.Item label="Remaining">{remainingQty}</Descriptions.Item>
          </Descriptions>
        )}

        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <FormField
              label="Issue Qty"
              name="issuedQty"
              fieldType="number"
              rules={[
                { required: true, message: 'Issue quantity is required' },
                {
                  validator: (_, value) =>
                    value > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Quantity must be greater than zero')),
                },
              ]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <FormField
              label="Store Location"
              name="storeLocationId"
              fieldType="select"
              options={locations.map(loc => ({ label: loc.name, value: loc.id }))}
              rules={[{ required: true, message: 'Store location is required' }]}
            />
          </Col>
          {selectedItem?.batchTracking && (
            <Col xs={24} sm={12}>
              <FormField
                label="Batch No"
                name="batchNo"
                rules={[{ required: true, message: 'This component is batch tracked' }]}
              />
            </Col>
          )}
          {selectedItem?.heatTracking && (
            <Col xs={24} sm={12}>
              <FormField
                label="Heat No"
                name="heatNo"
                rules={[{ required: true, message: 'This component is heat tracked' }]}
              />
            </Col>
          )}
          <Col xs={24} sm={12}>
            <FormField label="Issue Date" name="issueDate" fieldType="date" />
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
