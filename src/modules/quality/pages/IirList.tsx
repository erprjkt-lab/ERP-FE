import { EyeOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Modal, Row, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { ITEM_TYPE_RAW_MATERIAL } from '@/modules/procurement/constants'
import { useGrns } from '@/modules/procurement/hooks/usePurchaseGrns'
import type { GrnItem } from '@/types/procurement'
import { IncomingInspectionReports } from '../components/IncomingInspectionReports'
import { useIncomingInspectionReportsForGrnItem } from '../hooks/useInspectionReports'

interface RmLineRow extends GrnItem {
  grnNo: string
}

const IirStatusTag: FC<{ grnItemId: string }> = ({ grnItemId }) => {
  const { hasApprovedIir, isLoading } = useIncomingInspectionReportsForGrnItem(grnItemId)
  if (isLoading) return null
  return hasApprovedIir ? (
    <Tag color="green">Approved IIR on file</Tag>
  ) : (
    <Tag color="orange">IIR Required</Tag>
  )
}

const getColumns = (onOpen: (record: RmLineRow) => void): TableColumnsType<RmLineRow> => [
  { title: 'GRN No', dataIndex: 'grnNo', key: 'grnNo', width: 130 },
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => r.itemName ?? r.itemId,
  },
  { title: 'Received Qty', dataIndex: 'receivedQty', key: 'receivedQty', width: 120 },
  {
    title: 'IIR Status',
    key: 'iirStatus',
    width: 170,
    render: (_, r) => <IirStatusTag grnItemId={r.id} />,
  },
  {
    title: 'Action',
    key: 'action',
    width: 140,
    render: (_, r) => (
      <Button size="small" icon={<EyeOutlined />} onClick={() => onOpen(r)}>
        Manage IIR
      </Button>
    ),
  },
]

export const IirList: FC = () => {
  const [search, setSearch] = useState('')
  const [activeLine, setActiveLine] = useState<RmLineRow>()
  const { data: grns, isLoading } = useGrns()

  const rmLines: RmLineRow[] = grns.flatMap(grn =>
    grn.items
      .filter(item => item.itemType === ITEM_TYPE_RAW_MATERIAL)
      .map(item => ({ ...item, grnNo: grn.grnNo })),
  )

  const filtered = rmLines.filter(line => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      line.grnNo.toLowerCase().includes(term) || (line.itemName ?? '').toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Incoming Inspection Reports (IIR)"
        subtitle={`${filtered.length} of ${rmLines.length} raw material GRN lines`}
        breadcrumbs={[{ label: 'Quality' }, { label: 'IIR' }]}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by GRN no. or item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<RmLineRow>
          columns={getColumns(record => setActiveLine(record))}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="raw material lines"
          fillHeight
          locale={{ emptyText: 'No raw material GRN lines found.' }}
        />
      </Card>

      {activeLine && (
        <Modal
          title={`IIR — ${activeLine.itemName ?? activeLine.itemId} (${activeLine.grnNo})`}
          open
          onCancel={() => setActiveLine(undefined)}
          footer={null}
          width={840}
        >
          <IncomingInspectionReports grnItemId={activeLine.id} itemId={activeLine.itemId} />
        </Modal>
      )}
    </div>
  )
}
