import { CheckOutlined, ExportOutlined, InboxOutlined, LockOutlined } from '@ant-design/icons'
import { App, Button, Card, Space, Table, Tabs, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AcceptChallanItemModal } from '../components/AcceptChallanItemModal'
import { CreateChallanModal } from '../components/CreateChallanModal'
import { usePendingChallanRequests } from '../hooks/useChallanRequests'
import {
  useAllChallans,
  useCloseChallan,
  useMarkChallanReceived,
} from '../hooks/useJobCardChallans'
import { useJobCards } from '../hooks/useJobCards'
import type { Challan, ChallanItem, ChallanRequest } from '@/types/production'
import { getErrorMessage } from '@/api/client'

export const OutsourceList = () => {
  const { message } = App.useApp()
  const { data: jobCards = [] } = useJobCards()
  const { data: pendingRequests = [], isLoading: requestsLoading } = usePendingChallanRequests()
  const { data: challans = [], isLoading: challansLoading } = useAllChallans()
  const { mutateAsync: markReceived, isPending: markingReceived } = useMarkChallanReceived()
  const { mutateAsync: closeChallanMutation, isPending: closing } = useCloseChallan()

  const [activeTab, setActiveTab] = useState('pending')
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [createChallanOpen, setCreateChallanOpen] = useState(false)
  const [acceptTarget, setAcceptTarget] = useState<{ challan: Challan; item: ChallanItem }>()

  const handleMarkReceived = async (challanId: string) => {
    try {
      await markReceived(challanId)
      message.success('Challan marked received')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleClose = async (challanId: string) => {
    try {
      await closeChallanMutation(challanId)
      message.success('Challan closed')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const jobCardsById = useMemo(() => new Map(jobCards.map(jc => [jc.id, jc])), [jobCards])
  const jobCardLabel = (jobCardId: string) => {
    const jc = jobCardsById.get(jobCardId)
    return jc ? `${jc.jobCardNumber} · ${jc.itemName}` : jobCardId
  }

  const selectedRequests = pendingRequests.filter(r => selectedRequestIds.includes(r.id))

  const requestColumns: TableColumnsType<ChallanRequest> = [
    { title: 'Job Card', key: 'jobCard', render: (_, r) => jobCardLabel(r.jobCardId) },
    { title: 'Process', dataIndex: 'processName', key: 'processName', width: 160 },
    { title: 'Requested', dataIndex: 'requestedQty', key: 'requestedQty', width: 100 },
    { title: 'Dispatched', dataIndex: 'dispatchedQty', key: 'dispatchedQty', width: 100 },
    { title: 'Pending', dataIndex: 'pendingQty', key: 'pendingQty', width: 100 },
    {
      title: 'Requested By',
      dataIndex: 'requestedByName',
      key: 'requestedByName',
      render: v => v || '—',
    },
    {
      title: 'Requested At',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 120,
      render: v => (v ? String(v).slice(0, 10) : '—'),
    },
  ]

  const itemColumns: TableColumnsType<ChallanItem> = [
    { title: 'Job Card', key: 'jobCard', render: (_, item) => jobCardLabel(item.jobCardId) },
    { title: 'Process', dataIndex: 'processName', key: 'processName', width: 150 },
    { title: 'Dispatched', dataIndex: 'dispatchedQty', key: 'dispatchedQty', width: 100 },
    { title: 'Received', dataIndex: 'receivedQty', key: 'receivedQty', width: 100 },
    { title: 'Outstanding', dataIndex: 'outstandingQty', key: 'outstandingQty', width: 100 },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', width: 90, render: v => v ?? '—' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 100, render: v => v ?? '—' },
  ]

  const challanColumns: TableColumnsType<Challan> = [
    { title: 'Challan No', dataIndex: 'challanNumber', key: 'challanNumber', width: 150 },
    { title: 'Date', dataIndex: 'challanDate', key: 'challanDate', width: 110 },
    { title: 'Vendor', dataIndex: 'destinationPartyName', key: 'destinationPartyName' },
    { title: 'Items', key: 'items', width: 80, render: (_, c) => c.items.length },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: status => <StatusBadge status={status} />,
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, challan) => (
        <Space size="small">
          <Button
            size="small"
            icon={<CheckOutlined />}
            disabled={challan.status !== 'open'}
            loading={markingReceived}
            onClick={() => handleMarkReceived(challan.id)}
          >
            Mark Received
          </Button>
          <Button
            size="small"
            icon={<LockOutlined />}
            disabled={challan.status !== 'received'}
            loading={closing}
            onClick={() => handleClose(challan.id)}
          >
            Close
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Outsource"
        subtitle="Send work out to vendors and track it back to a challan"
        breadcrumbs={[{ label: 'Production' }, { label: 'Outsource' }]}
      />

      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <Tabs
          style={{ height: '100%' }}
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === 'pending' ? (
              <Tooltip
                title={selectedRequestIds.length === 0 ? 'Select at least one request' : undefined}
              >
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  disabled={selectedRequestIds.length === 0}
                  onClick={() => setCreateChallanOpen(true)}
                >
                  Create Challan ({selectedRequestIds.length})
                </Button>
              </Tooltip>
            ) : null
          }
          items={[
            {
              key: 'pending',
              label: `Pending Requests (${pendingRequests.length})`,
              children: (
                <DataTable<ChallanRequest>
                  columns={requestColumns}
                  dataSource={pendingRequests}
                  rowKey="id"
                  loading={requestsLoading}
                  pagination={false}
                  totalLabel="pending requests"
                  rowSelection={{
                    selectedRowKeys: selectedRequestIds,
                    onChange: keys => setSelectedRequestIds(keys as string[]),
                  }}
                />
              ),
            },
            {
              key: 'challans',
              label: `Challans (${challans.length})`,
              children: (
                <DataTable<Challan>
                  columns={challanColumns}
                  dataSource={challans}
                  rowKey="id"
                  loading={challansLoading}
                  pagination={false}
                  totalLabel="challans"
                  expandable={{
                    expandedRowRender: challan => (
                      <Table<ChallanItem>
                        columns={[
                          ...itemColumns,
                          {
                            title: 'Action',
                            key: 'action',
                            width: 110,
                            render: (_, item) => (
                              <Button
                                size="small"
                                icon={
                                  item.outstandingQty > 0 ? <InboxOutlined /> : <CheckOutlined />
                                }
                                disabled={item.outstandingQty <= 0 || challan.status === 'closed'}
                                onClick={() => setAcceptTarget({ challan, item })}
                              >
                                Accept
                              </Button>
                            ),
                          },
                        ]}
                        dataSource={challan.items}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <CreateChallanModal
        open={createChallanOpen}
        onClose={() => {
          setCreateChallanOpen(false)
          setSelectedRequestIds([])
        }}
        requests={selectedRequests}
        jobCardLabel={jobCardLabel}
      />

      <AcceptChallanItemModal
        open={!!acceptTarget}
        onClose={() => setAcceptTarget(undefined)}
        challan={acceptTarget?.challan}
        item={acceptTarget?.item}
        jobCardLabel={acceptTarget ? jobCardLabel(acceptTarget.item.jobCardId) : ''}
      />
    </div>
  )
}
