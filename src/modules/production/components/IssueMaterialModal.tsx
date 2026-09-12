import { App, Col, Descriptions, Form, Row, Select, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useMemo } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '@/modules/inventory/hooks/useStockBalance'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { useItemBom } from '../hooks/useItemBom'
import { useBomRequirements, useIssueMaterial } from '../hooks/useJobCardMaterials'

const stockDetailColumns: TableColumnsType<StockBalanceRow> = [
  { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
  { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
  { title: 'Serial No', dataIndex: 'serialNo', key: 'serialNo', render: v => v || '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
  {
    title: 'Avg Rate',
    dataIndex: 'avgRate',
    key: 'avgRate',
    align: 'right',
    render: (v: number | null) => (v != null ? v.toFixed(2) : '—'),
  },
]

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
  storeLocationId: string
  issuedQty: number
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
  const storeLocationId = Form.useWatch('storeLocationId', form) as string | undefined
  const batchNo = Form.useWatch('batchNo', form) as string | undefined

  const { data: stockRows = [] } = useStockBalance(componentItemId)

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

  const rowsAtLocation = useMemo(
    () => stockRows.filter(row => row.locationId === storeLocationId),
    [stockRows, storeLocationId],
  )

  // Only offer locations that actually hold stock of the selected component —
  // no point letting someone pick a store the item was never received into.
  const locationOptions = useMemo(() => {
    const totalsByLocation = new Map<string, number>()
    stockRows.forEach(row => {
      totalsByLocation.set(row.locationId, (totalsByLocation.get(row.locationId) ?? 0) + row.qty)
    })
    return locations
      .filter(loc => (totalsByLocation.get(loc.id) ?? 0) > 0)
      .map(loc => ({
        label: `${loc.name} (Avail: ${totalsByLocation.get(loc.id)})`,
        value: loc.id,
      }))
  }, [locations, stockRows])

  const batchOptions = useMemo(() => {
    const totalsByBatch = new Map<string, number>()
    rowsAtLocation.forEach(row => {
      if (!row.batchNo) return
      totalsByBatch.set(row.batchNo, (totalsByBatch.get(row.batchNo) ?? 0) + row.qty)
    })
    return Array.from(totalsByBatch.entries()).map(([batch, qty]) => ({
      label: `${batch} (Avail: ${qty})`,
      value: batch,
    }))
  }, [rowsAtLocation])

  const availableQty = selectedItem?.batchTracking
    ? (rowsAtLocation.find(row => row.batchNo === batchNo)?.qty ?? 0)
    : rowsAtLocation.reduce((sum, row) => sum + row.qty, 0)

  useEffect(() => {
    if (componentItemId) {
      form.setFieldValue('issuedQty', remainingQty > 0 ? remainingQty : undefined)
    }
    // A location valid for the previous component may hold none of the new
    // one, so it can't carry over.
    form.setFieldValue('storeLocationId', undefined)
    // Re-prefill only when the chosen component changes, never while the user
    // is editing the quantity they actually want to issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentItemId])

  useEffect(() => {
    // Available batches depend on component + location together, so a batch
    // chosen for a different pairing is no longer valid — clear it.
    form.setFieldValue('batchNo', undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentItemId, storeLocationId])

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
              label="Store Location"
              name="storeLocationId"
              fieldType="select"
              options={locationOptions}
              disabled={!componentItemId}
              placeholder={
                !componentItemId
                  ? 'Select component first'
                  : locationOptions.length
                    ? 'Select store location'
                    : 'No stock available for this component'
              }
              rules={[{ required: true, message: 'Store location is required' }]}
            />
          </Col>
          {selectedItem?.batchTracking && (
            <Col xs={24} sm={12}>
              <FormField
                label="Batch No"
                name="batchNo"
                fieldType="select"
                options={batchOptions}
                placeholder={storeLocationId ? 'Select batch' : 'Select store location first'}
                disabled={!storeLocationId}
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
        </Row>

        {componentItemId && storeLocationId && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, display: 'block', marginBottom: 6 }}
            >
              Stock available at this location
            </Typography.Text>
            <Table<StockBalanceRow>
              size="small"
              columns={stockDetailColumns}
              dataSource={rowsAtLocation}
              rowKey={row => `${row.batchNo}-${row.heatNo}-${row.serialNo}`}
              pagination={false}
              locale={{ emptyText: 'No stock recorded at this location' }}
              rowClassName={row =>
                selectedItem?.batchTracking && row.batchNo === batchNo
                  ? 'erp-selected-batch-row'
                  : ''
              }
              onRow={row => ({
                onClick: () => {
                  if (selectedItem?.batchTracking && row.batchNo) {
                    form.setFieldValue('batchNo', row.batchNo)
                  }
                },
                style: selectedItem?.batchTracking ? { cursor: 'pointer' } : undefined,
              })}
            />
          </div>
        )}

        {componentItemId && storeLocationId && (!selectedItem?.batchTracking || batchNo) && (
          <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Available for issue">{availableQty}</Descriptions.Item>
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
                  validator: (_, value) => {
                    if (!(value > 0)) {
                      return Promise.reject(new Error('Quantity must be greater than zero'))
                    }
                    if (storeLocationId && value > availableQty) {
                      return Promise.reject(new Error('Exceeds available stock at this location'))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <FormField label="Issue Date" name="issueDate" fieldType="date" />
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
