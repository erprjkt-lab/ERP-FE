import { App, Descriptions, Form, InputNumber, Select, Table, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { useStockBalance, type StockBalanceRow } from '@/modules/inventory/hooks/useStockBalance'
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
  issueDate?: { format: (fmt: string) => string }
}

function rowKey(row: StockBalanceRow): string {
  return `${row.locationId}-${row.batchNo}-${row.heatNo}-${row.serialNo}`
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

  // Requirement rows only exist once something has been issued, so fall back to
  // the BOM-derived plan (qty per unit x ordered qty) for the "required" figure.
  const requiredQty = selectedRequirement
    ? selectedRequirement.requiredQty
    : (selectedBomLine?.quantityPerUnit ?? 0) * orderedQty
  const issuedQty = selectedRequirement?.issuedQty ?? 0
  const remainingQty = Math.max(requiredQty - issuedQty, 0)

  const locationNameById = useMemo(() => new Map(locations.map(l => [l.id, l.name])), [locations])

  // Every distinct location/batch/heat/serial lot this component actually sits
  // in — the user picks how much to take from each lot directly, rather than
  // picking a location and batch through separate dropdowns first.
  const issuableRows = useMemo(() => stockRows.filter(row => row.qty > 0), [stockRows])

  const totalSelected = Object.values(issueQtyByRow).reduce((sum, qty) => sum + (qty || 0), 0)

  // Quantities picked for the previous component don't carry over — adjust
  // state during render instead of an effect (React's recommended pattern for
  // resetting state when a prop changes) so it never lags a render behind.
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
    { title: 'Stock Qty', dataIndex: 'qty', key: 'qty', align: 'right', width: 90 },
    {
      title: 'Issue Qty',
      key: 'issueQty',
      width: 130,
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          max={row.qty}
          style={{ width: '100%' }}
          value={issueQtyByRow[rowKey(row)] || undefined}
          onChange={value => setIssueQtyByRow(prev => ({ ...prev, [rowKey(row)]: value ?? 0 }))}
        />
      ),
    },
  ]

  const handleOk = async () => {
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
    const failures: string[] = []

    setSubmitting(true)
    for (const { row, qty } of selections) {
      const label = `${locationNameById.get(row.locationId) ?? row.locationId}${row.batchNo ? ` / ${row.batchNo}` : ''}`
      try {
        await issueMaterial({
          component_item_id: Number(values.componentItemId),
          store_location_id: Number(row.locationId),
          issued_qty: qty,
          batch_no: row.batchNo || undefined,
          heat_no: row.heatNo || undefined,
          issue_date: issueDate,
        })
        setIssueQtyByRow(prev => {
          const next = { ...prev }
          delete next[rowKey(row)]
          return next
        })
      } catch (error) {
        failures.push(`${label} — ${error instanceof Error ? error.message : 'failed'}`)
      }
    }
    setSubmitting(false)

    if (failures.length === 0) {
      message.success(
        `Material issued from ${selections.length} ${selections.length > 1 ? 'lots' : 'lot'}`,
      )
      form.resetFields()
      onClose()
    } else {
      message.error(`Some issues failed — ${failures.join('; ')}`)
    }
  }

  return (
    <Modal
      title="Issue Material"
      open={open}
      onCancel={() => {
        form.resetFields()
        setIssueQtyByRow({})
        onClose()
      }}
      onOk={handleOk}
      confirmLoading={submitting}
      width={720}
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
          <>
            <FormField
              label="Issue Date"
              name="issueDate"
              fieldType="date"
              style={{ width: 200 }}
            />

            <Descriptions size="small" column={3} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Required">{requiredQty}</Descriptions.Item>
              <Descriptions.Item label="Issued">{issuedQty}</Descriptions.Item>
              <Descriptions.Item label="Remaining">{remainingQty}</Descriptions.Item>
            </Descriptions>

            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, display: 'block', marginBottom: 6 }}
            >
              Select how much to issue from each location/batch
            </Typography.Text>
            <Table<StockBalanceRow>
              size="small"
              columns={columns}
              dataSource={issuableRows}
              rowKey={rowKey}
              pagination={false}
              locale={{ emptyText: 'No stock available for this component' }}
              style={{ marginBottom: 12 }}
            />

            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Total Issue Qty">
                <span
                  style={{
                    fontWeight: 600,
                    color: totalSelected > remainingQty ? '#d46b08' : undefined,
                  }}
                >
                  {totalSelected}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Form>
    </Modal>
  )
}
