import { Alert, Card, Col, Row, Select } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { loadMoreRender } from '@/components/ui/loadMoreRender'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { ItemInspectionParameterForm } from './ItemInspectionParameterForm'

/** Standalone entry point for the Inspection Parameter master.
 *
 * ERP-BE scopes parameters to an item (GET /items/{item}/inspection-parameters)
 * and exposes no list across items, so this picks the item first and then shows
 * the same screen the item and BOM routes open.
 */
export const InspectionParameterList: FC = () => {
  const [itemId, setItemId] = useState<string>()
  const { data: items, isLoading, loadMore, hasMore } = useProcurementItems()

  const itemOptions = items.map(item => ({
    label: `${item.code} — ${item.name}`,
    value: item.id,
  }))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Inspection Parameters"
        subtitle="Quality checks defined per item"
        breadcrumbs={[{ label: 'Quality' }, { label: 'Inspection Parameters' }]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={16} md={10}>
            <Select
              placeholder="Select an item to see its parameters"
              value={itemId}
              onChange={setItemId}
              options={itemOptions}
              loading={isLoading}
              showSearch
              allowClear
              style={{ width: '100%' }}
              popupRender={loadMoreRender(hasMore, loadMore)}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Col>
        </Row>
      </Card>

      {itemId ? (
        <ItemInspectionParameterForm
          itemId={itemId}
          breadcrumbParent={{ label: 'Quality' }}
          embedded
        />
      ) : (
        <Alert
          type="info"
          showIcon
          message="Pick an item above to view or edit its inspection parameters."
        />
      )}
    </div>
  )
}
