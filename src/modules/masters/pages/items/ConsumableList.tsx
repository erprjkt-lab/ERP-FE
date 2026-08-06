import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { UploadField } from '@/components/ui/UploadField'
import type { Consumable } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../../constants'
import {
  useConsumables,
  useCreateConsumable,
  useDeleteConsumable,
  useUpdateConsumable,
} from '../../hooks/useConsumables'
import { useItemCategories } from '../../hooks/useItemCategories'
import { useUoms } from '../../hooks/useUoms'

export const ConsumableList: FC = () => {
  const { data: consumables = [], isLoading } = useConsumables()
  const { mutateAsync: createConsumable } = useCreateConsumable()
  const { mutateAsync: updateConsumable } = useUpdateConsumable()
  const { mutateAsync: deleteConsumable } = useDeleteConsumable()
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()

  const categoryOptions = categories.map(c => ({ label: c.name, value: String(c.id) }))
  const uomOptions = uoms.map(u => ({ label: u.name, value: String(u.id) }))

  return (
    <SimpleMasterList<Consumable>
      title="Consumables"
      breadcrumbParent={{ label: 'Items', href: '/masters/items' }}
      breadcrumbLabel="Consumable"
      totalLabel="consumables"
      addButtonLabel="Add Consumable"
      modalWidth={720}
      data={consumables}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Item Name"
              name="name"
              rules={[{ required: true, message: 'Item name is required' }]}
            />
            <FormField
              label="Category"
              name="categoryId"
              fieldType="select"
              options={categoryOptions}
              rules={[{ required: true, message: 'Category is required' }]}
            />
            <FormField label="Brand" name="brand" />
            <FormField
              label="UOM"
              name="uomId"
              fieldType="select"
              options={uomOptions}
              rules={[{ required: true, message: 'UOM is required' }]}
            />
            <FormField
              label="Alternate UOM"
              name="alternateUomId"
              fieldType="select"
              options={uomOptions}
            />
            <FormField label="HSN Code" name="hsnCode" />
            <FormField label="GST %" name="gstPercent" fieldType="number" />
            <FormField label="Price" name="price" fieldType="number" />
            <FormField
              label="Status"
              name="status"
              fieldType="select"
              options={MASTER_STATUS_OPTIONS}
              initialValue="active"
            />
          </div>
          <FormField label="Description" name="description" fieldType="textarea" />
          <FormField label="Image" name="imageUrl">
            <UploadField mode="image" accept="image/*" />
          </FormField>
        </>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          name: values.name as string,
          categoryId: values.categoryId as string,
          category: categoryOptions.find(o => o.value === values.categoryId)?.label ?? '',
          uomId: values.uomId as string,
          uom: uomOptions.find(o => o.value === values.uomId)?.label ?? '',
          alternateUomId: values.alternateUomId as string | undefined,
          alternateUom: uomOptions.find(o => o.value === values.alternateUomId)?.label,
          hsnCode: values.hsnCode as string | undefined,
          gstPercent: values.gstPercent as number | undefined,
          description: values.description as string | undefined,
          status: (values.status as 'active' | 'inactive') ?? 'active',
          imageUrl: values.imageUrl as string | undefined,
          price: values.price as number | undefined,
        }
        if (editing) {
          await updateConsumable({ id: editing.id, payload })
        } else {
          await createConsumable(payload)
        }
      }}
      onDelete={async record => {
        await deleteConsumable(record.id)
      }}
    />
  )
}
