import {
  App,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  InputNumber,
  Row,
  Select,
  Table,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '@/modules/inventory/hooks/useStockBalance'
import { useItemBom } from '@/modules/production/hooks/useItemBom'
import {
  useBomRequirements,
  useIssueMaterial,
} from '@/modules/production/hooks/useJobCardMaterials'

export interface IssueMaterialDrawerProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  jobCardNumber?: string
  /** The finished good being produced — its BOM drives the component list. */
  itemId: string
  orderedQty: number
}

interface IssueFormValues {
  componentItemId: string
  issueDate?: dayjs.Dayjs
}

function rowKey(row: StockBalanceRow): string {
  return `${row.locationId}-${row.batchNo}-${row.heatNo}-${row.serialNo}`
}

export const IssueMaterialDrawer: FC<IssueMaterialDrawerProps> = ({
  open,
  onClose,
  jobCardId,
  jobCardNumber,
  itemId,
  orderedQty,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<IssueFormValues>()
  const [issueQtyByRow, setIssueQtyByRow] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: bomLines = [] } = useItemBom(itemId)
  const { data: requirements = [] } = useBomRequirements(jobCardId)
  const { data: locations = [] } = useLocations()
  const { mutateAsync: issueMaterial } = useIssueMaterial(jobCardId)

  const componentItemId = Form.useWatch('componentItemId', form) as string | undefined
  const { data: stockRows = [] } = useStockBalance(componentItemId)

  const selectedBomLine = bomLines.find(line => line.componentItemId === componentItemId)
  const selectedRequirement = requirements.find(req => req.componentItemId === componentItemId)

  const requiredQty = selectedRequirement
    ? selectedRequirement.requiredQty
    : (selectedBomLine?.quantityPerUnit ?? 0) * orderedQty
  const issuedQty = selectedRequirement?.issuedQty ?? 0
  const remainingQty = Math.max(requiredQty - issuedQty, 0)

  const locationNameById = useMemo(() => new Map(locations.map(l => [l.id, l.name])), [locations])
  const issuableRows = useMemo(() => stockRows.filter(row => row.qty > 0), [stockRows])
  const totalSelected = Object.values(issueQtyByRow).reduce((sum, qty) => sum + (qty || 0), 0)

  const [trackedComponentItemId, setTrackedComponentItemId] = useState(componentItemId)
  if (componentItemId !== trackedComponentItemId) {
    setTrackedComponentItemId(componentItemId)
    setIssueQtyByRow({})
  }

  const componentOptions = bomLines.map(line => ({
    label: `${line.componentName} (${line.quantityPerUnit} ${line.uomName} / unit)`,
    value: line.componentItemId,
  }))

  const columns: TableColumnsType<StockBalanceRow> = [
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: id => locationNameById.get(id) ?? id,
    },
    { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
    { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
    { title: 'Stock Qty', dataIndex: 'qty', key: 'qty', align: 'right', width: 100 },
    {
      title: 'Issue Qty',
      key: 'issueQty',
      width: 140,
      render: (_, row) => (
        <InputNumber
          size="middle"
          min={0}
          max={row.qty}
          style={{ width: '100%' }}
          value={issueQtyByRow[rowKey(row)] || undefined}
          onChange={value => setIssueQtyByRow(prev => ({ ...prev, [rowKey(row)]: value ?? 0 }))}
          placeholder="0"
        />
      ),
    },
  ]

  const handleClose = () => {
    form.resetFields()
    setIssueQtyByRow({})
    onClose()
  }

  const handleSubmit = async () => {
    let values: IssueFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const selections = issuableRows
      .map(row => ({ row, qty: issueQtyByRow[rowKey(row)] ?? 0 }))
      .filter(entry => entry.qty > 0)

    if (selections.length === 0) {
      message.error('Enter a quantity to issue from at least one location/batch')
      return
    }

    const issueDate = values.issueDate ? values.issueDate.format('YYYY-MM-DD') : undefined

    setSubmitting(true)
    try {
      await issueMaterial({
        component_item_id: Number(values.componentItemId),
        issue_date: issueDate,
        batches: selections.map(({ row, qty }) => ({
          store_location_id: Number(row.locationId),
          batch_no: row.batchNo || undefined,
          heat_no: row.heatNo || undefined,
          issued_qty: qty,
        })),
      })
      message.success(
        `Material issued from ${selections.length} ${selections.length > 1 ? 'lots' : 'lot'}`,
      )
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDrawer
      title={jobCardNumber ? `Issue Material — ${jobCardNumber}` : 'Issue Material'}
      open={open}
      width={860}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText="Issue Material"
    >
      <Form form={form} layout="vertical" initialValues={{ issueDate: dayjs() }}>
        <FormSection title="Component Selection">
          <Row gutter={24}>
            <Col xs={24} sm={16}>
              <Form.Item
                label="Component"
                name="componentItemId"
                rules={[{ required: true, message: 'Component is required' }]}
              >
                <Select
                  placeholder={
                    bomLines.length ? 'Select component' : 'No BOM defined for this item'
                  }
                  options={componentOptions}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Issue Date" name="issueDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        {componentItemId ? (
          <FormSection title="Stock Allocation">
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 3 }}
              bordered
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Required Qty">{requiredQty}</Descriptions.Item>
              <Descriptions.Item label="Already Issued">{issuedQty}</Descriptions.Item>
              <Descriptions.Item label="Remaining to Issue">{remainingQty}</Descriptions.Item>
            </Descriptions>

            <Typography.Text
              type="secondary"
              style={{ fontSize: 13, display: 'block', marginBottom: 8 }}
            >
              Allocate quantity to issue from available warehouse batches/locations below:
            </Typography.Text>

            <Table<StockBalanceRow>
              size="small"
              columns={columns}
              dataSource={issuableRows}
              rowKey={rowKey}
              pagination={false}
              locale={{ emptyText: 'No stock available for this component across locations.' }}
              style={{ marginBottom: 16 }}
            />

            <Card size="small" style={{ background: 'rgba(0, 0, 0, 0.02)' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Typography.Text strong>Total Selected Issue Qty:</Typography.Text>
                <Typography.Text
                  strong
                  style={{
                    fontSize: 16,
                    color: totalSelected > remainingQty ? '#fa8c16' : undefined,
                  }}
                >
                  {totalSelected}
                  {totalSelected > remainingQty && (
                    <span
                      style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, color: '#fa8c16' }}
                    >
                      (Exceeds remaining {remainingQty})
                    </span>
                  )}
                </Typography.Text>
              </div>
            </Card>
          </FormSection>
        ) : (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: 8,
              border: '1px dashed rgba(0, 0, 0, 0.15)',
            }}
          >
            <Typography.Text type="secondary">
              Select a component above to view required quantities and available inventory stock.
            </Typography.Text>
          </div>
        )}
      </Form>
    </FormDrawer>
  )
}
