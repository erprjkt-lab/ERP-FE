import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Table, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import type { OpeningStock, OpeningStockItem } from '@/types/inventory'
import { OpeningStockFormDrawer } from '../components/OpeningStockFormDrawer'
import { useDeleteOpeningStock, useOpeningStocks } from '../hooks/useOpeningStocks'

const ITEM_COLUMNS: TableColumnsType<OpeningStockItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, row) => [row.itemCode, row.itemName].filter(Boolean).join(' — ') || '—',
  },
  { title: 'Location', dataIndex: 'locationName', key: 'locationName', render: v => v ?? '—' },
  { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
  { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right', width: 110 },
  {
    title: 'Rate',
    dataIndex: 'rate',
    key: 'rate',
    align: 'right',
    width: 110,
    render: v => (v != null ? v.toFixed(2) : '—'),
  },
]

export const OpeningStockList: FC = () => {
  const { message, modal } = App.useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: entries, isLoading } = useOpeningStocks()
  const { mutateAsync: deleteEntry } = useDeleteOpeningStock()

  const handleDelete = (record: OpeningStock) => {
    modal.confirm({
      title: `Delete ${record.entryNumber}?`,
      content:
        'This reverses the stock this entry posted. It is refused if any of that stock has already been issued or sold.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEntry(record.id)
          message.success('Opening stock entry deleted and stock reversed')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns: TableColumnsType<OpeningStock> = [
    { title: 'Entry #', dataIndex: 'entryNumber', key: 'entryNumber', width: 160 },
    { title: 'Date', dataIndex: 'entryDate', key: 'entryDate', width: 120 },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => {
        const names = record.items.map(i => i.itemName ?? i.itemCode ?? '—')
        if (names.length === 0) return '—'
        const preview = names.slice(0, 2).join(', ')
        const extra = names.length > 2 ? ` +${names.length - 2} more` : ''
        return (
          <Tooltip title={names.join(', ')} placement="topLeft">
            <span>
              {preview}
              {extra}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: 'Total Qty',
      key: 'totalQty',
      width: 110,
      align: 'right',
      render: (_, record) => record.items.reduce((sum, item) => sum + item.qty, 0),
    },
    { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', render: v => v || '—' },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Delete & reverse stock">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={e => {
              e.stopPropagation()
              handleDelete(record)
            }}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Opening Stock"
        subtitle={`${entries.length} entries — load stock that was already on hand before the system went live`}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Opening Stock' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Opening Stock
          </Button>
        }
      />

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<OpeningStock>
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={isLoading}
          totalLabel="entries"
          fillHeight
          expandable={{
            expandedRowRender: record => (
              <Table<OpeningStockItem>
                columns={ITEM_COLUMNS}
                dataSource={record.items}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ),
            rowExpandable: record => record.items.length > 0,
          }}
          locale={{
            emptyText: (
              <Typography.Text type="secondary">No opening stock posted yet.</Typography.Text>
            ),
          }}
        />
      </Card>

      <OpeningStockFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
