import type { FC } from 'react'
import { useParams } from 'react-router-dom'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFinishedGood } from '@/modules/masters/hooks/useFinishedGoods'
import { useUoms } from '@/modules/masters/hooks/useUoms'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ItemBomLine } from '@/types/production'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateItemBomLine,
  useDeleteItemBomLine,
  useItemBom,
  useUpdateItemBomLine,
} from '../hooks/useItemBom'

export const ItemBomForm: FC = () => {
  const { itemId } = useParams()
  const { data: finishedGood } = useFinishedGood(itemId)
  const { data: bomLines = [], isLoading } = useItemBom(itemId)
  const { data: componentItems = [] } = useProcurementItems()
  const { data: uoms = [] } = useUoms()
  const { mutateAsync: createLine } = useCreateItemBomLine(itemId)
  const { mutateAsync: updateLine } = useUpdateItemBomLine(itemId)
  const { mutateAsync: deleteLine } = useDeleteItemBomLine(itemId)

  const componentOptions = componentItems
    .filter(item => item.id !== itemId)
    .map(item => ({ label: `${item.code} · ${item.name}`, value: item.id }))
  const uomOptions = uoms.map(u => ({ label: u.name, value: String(u.id) }))

  return (
    <SimpleMasterList<ItemBomLine>
      title={finishedGood ? `Item BOM — ${finishedGood.code} · ${finishedGood.name}` : 'Item BOM'}
      breadcrumbParent={{ label: 'BOM', href: '/production/bom' }}
      breadcrumbLabel="Item BOM"
      totalLabel="components"
      addButtonLabel="Add Component"
      modalWidth={560}
      data={bomLines}
      loading={isLoading}
      columns={[
        { title: 'Component', dataIndex: 'componentName', key: 'componentName' },
        { title: 'Qty / Unit', dataIndex: 'quantityPerUnit', key: 'quantityPerUnit', width: 110 },
        { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 90 },
        {
          title: 'Scrap %',
          dataIndex: 'scrapAllowancePercent',
          key: 'scrapAllowancePercent',
          width: 100,
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: status => <StatusBadge status={status} />,
        },
      ]}
      renderFields={() => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FormField
            label="Component Item"
            name="componentItemId"
            fieldType="select"
            options={componentOptions}
            rules={[{ required: true, message: 'Component item is required' }]}
          />
          <FormField
            label="UOM"
            name="uomId"
            fieldType="select"
            options={uomOptions}
            rules={[{ required: true, message: 'UOM is required' }]}
          />
          <FormField
            label="Quantity per Unit"
            name="quantityPerUnit"
            fieldType="number"
            rules={[{ required: true, message: 'Quantity is required' }]}
          />
          <FormField label="Scrap Allowance (%)" name="scrapAllowancePercent" fieldType="number" />
          <FormField
            label="Status"
            name="status"
            fieldType="select"
            options={MASTER_STATUS_OPTIONS}
            initialValue="active"
          />
        </div>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          component_item_id: Number(values.componentItemId),
          quantity_per_unit: values.quantityPerUnit as number,
          uom_id: Number(values.uomId),
          scrap_allowance_percent: values.scrapAllowancePercent as number | undefined,
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateLine({ id: editing.id, payload })
        } else {
          await createLine(payload)
        }
      }}
      onDelete={async record => {
        await deleteLine(record.id)
      }}
    />
  )
}
