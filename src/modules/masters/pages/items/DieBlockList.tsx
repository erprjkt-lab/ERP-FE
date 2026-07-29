import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { DieBlock } from '@/types/masters'
import {
  useCreateDieBlock,
  useDeleteDieBlock,
  useDieBlocks,
  useUpdateDieBlock,
} from '../../hooks/useDieBlocks'

// Placeholder schema (Item Code/Name/Category/UOM/Price) — the source spec
// spreadsheet has no confirmed field list for Die/Block yet. See "Draft
// schema" badge in ItemsLayout's left rail.
export const DieBlockList: FC = () => {
  const { data: dieBlocks = [], isLoading } = useDieBlocks()
  const { mutateAsync: createDieBlock } = useCreateDieBlock()
  const { mutateAsync: updateDieBlock } = useUpdateDieBlock()
  const { mutateAsync: deleteDieBlock } = useDeleteDieBlock()

  return (
    <SimpleMasterList<DieBlock>
      title="Die / Block"
      breadcrumbParent={{ label: 'Items', href: '/masters/items' }}
      breadcrumbLabel="Die/Block"
      totalLabel="dies & blocks"
      addButtonLabel="Add Die/Block"
      data={dieBlocks}
      loading={isLoading}
      columns={[
        { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        { title: 'UOM', dataIndex: 'uom', key: 'uom', width: 90 },
        { title: 'Price', dataIndex: 'price', key: 'price', width: 100 },
      ]}
      renderFields={() => (
        <>
          <FormField
            label="Item Name"
            name="name"
            rules={[{ required: true, message: 'Item name is required' }]}
          />
          <FormField
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Category is required' }]}
          />
          <FormField
            label="UOM"
            name="uom"
            rules={[{ required: true, message: 'UOM is required' }]}
          />
          <FormField label="Price" name="price" fieldType="number" />
        </>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          name: values.name as string,
          category: values.category as string,
          uom: values.uom as string,
          price: values.price as number | undefined,
        }
        if (editing) {
          await updateDieBlock({ id: editing.id, payload })
        } else {
          await createDieBlock(payload)
        }
      }}
      onDelete={async record => {
        await deleteDieBlock(record.id)
      }}
    />
  )
}
