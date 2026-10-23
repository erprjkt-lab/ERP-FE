import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { Drawer } from '@/components/ui/Drawer'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFinishedGood } from '@/modules/masters/hooks/useFinishedGoods'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ItemBomLine } from '@/types/production'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateItemBomLine,
  useDeleteItemBomLine,
  useItemBom,
  useUpdateItemBomLine,
} from '../hooks/useItemBom'
import { deferMount } from '@/components/ui/deferMount'

export interface ItemBomDrawerProps {
  open: boolean
  onClose: () => void
  itemId?: string
}

const ItemBomDrawerInner: FC<ItemBomDrawerProps> = ({ open, onClose, itemId }) => {
  const { data: finishedGood } = useFinishedGood(itemId)
  const { data: bomLines = [], isLoading } = useItemBom(itemId)
  const { data: componentItems = [] } = useProcurementItems()
  const { mutateAsync: createLine } = useCreateItemBomLine(itemId)
  const { mutateAsync: updateLine } = useUpdateItemBomLine(itemId)
  const { mutateAsync: deleteLine } = useDeleteItemBomLine(itemId)

  const componentOptions = componentItems
    .filter(item => item.id !== itemId)
    .map(item => ({ label: `${item.code} · ${item.name}`, value: item.id }))

  return (
    <Drawer
      title={finishedGood ? `Item BOM — ${finishedGood.code} · ${finishedGood.name}` : 'Item BOM'}
      open={open}
      onClose={onClose}
      width={900}
    >
      <SimpleMasterList<ItemBomLine>
        moduleKey="item-bom"
        embedded
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
          <div className="erp-form-grid">
            <FormField
              label="Component Item"
              name="componentItemId"
              fieldType="select"
              options={componentOptions}
              rules={[{ required: true, message: 'Component item is required' }]}
            />
            <FormField
              label="Quantity per Unit"
              name="quantityPerUnit"
              fieldType="number"
              rules={[{ required: true, message: 'Quantity is required' }]}
            />
            <FormField
              label="Scrap Allowance (%)"
              name="scrapAllowancePercent"
              fieldType="number"
            />
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
          // No UOM picker: a component is consumed in its own item-master UOM,
          // and ERP-BE requires uom_id on the line.
          const uomId = componentItems.find(i => i.id === values.componentItemId)?.uomId
          if (!uomId) throw new Error('This component has no UOM set in the item master')

          const payload = {
            component_item_id: Number(values.componentItemId),
            quantity_per_unit: values.quantityPerUnit as number,
            uom_id: Number(uomId),
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
    </Drawer>
  )
}

export const ItemBomDrawer = deferMount(ItemBomDrawerInner)
