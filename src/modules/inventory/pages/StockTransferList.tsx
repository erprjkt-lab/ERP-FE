import { ArrowRightOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Space, Table, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import type { StockTransfer, StockTransferItem } from '@/types/inventory'
import { StockTransferFormDrawer } from '../components/StockTransferFormDrawer'
import { useDeleteStockTransfer, useStockTransfers } from '../hooks/useStockTransfers'

const ITEM_COLUMNS: TableColumnsType<StockTransferItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, row) => [row.itemCode, row.itemName].filter(Boolean).join(' — ') || '—',
  },
  { title: 'Batch No', dataIndex: 'batchNo', key: 'batchNo', render: v => v || '—' },
  { title: 'Heat No', dataIndex: 'heatNo', key: 'heatNo', render: v => v || '—' },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right', width: 110 },
  { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', render: v => v || '—' },
]

export const StockTransferList: FC = () => {
  const { message, modal } = App.useApp()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: transfers, isLoading } = useStockTransfers()
  const { mutateAsync: deleteTransfer } = useDeleteStockTransfer()

  const handleDelete = (record: StockTransfer) => {
    modal.confirm({
      title: `Delete ${record.transferNumber}?`,
      content:
        'This moves the stock back to the source location. It is refused if the transferred stock has already been consumed at the destination.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTransfer(record.id)
          message.success('Stock transfer deleted and stock reversed')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns: TableColumnsType<StockTransfer> = [
    { title: 'Transfer #', dataIndex: 'transferNumber', key: 'transferNumber', width: 160 },
    { title: 'Date', dataIndex: 'transferDate', key: 'transferDate', width: 120 },
    {
      title: 'Movement',
      key: 'movement',
      render: (_, record) => (
        <Space size={6}>
          <span>{record.fromLocationName ?? record.fromLocationId}</span>
          <ArrowRightOutlined style={{ color: 'rgba(0,0,0,0.35)' }} />
          <span>{record.toLocationName ?? record.toLocationId}</span>
        </Space>
      ),
    },
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
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Delete & reverse transfer">
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
        title="Stock Transfer"
        subtitle={`${transfers.length} transfers — move stock between your own store locations`}
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Transfer' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Transfer
          </Button>
        }
      />

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockTransfer>
          columns={columns}
          dataSource={transfers}
          rowKey="id"
          loading={isLoading}
          totalLabel="transfers"
          fillHeight
          expandable={{
            expandedRowRender: record => (
              <Table<StockTransferItem>
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
            emptyText: <Typography.Text type="secondary">No stock transfers yet.</Typography.Text>,
          }}
        />
      </Card>

      <StockTransferFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
