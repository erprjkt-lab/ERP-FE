import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { PackingMaterial } from '@/types/masters'
import { useItemCategories } from '../../hooks/useItemCategories'
import {
  useCreatePackingMaterial,
  useDeletePackingMaterial,
  usePackingMaterials,
  useUpdatePackingMaterial,
} from '../../hooks/usePackingMaterials'
import { useUoms } from '../../hooks/useUoms'

export const PackingMaterialList: FC = () => {
  const { data: packingMaterials = [], isLoading } = usePackingMaterials()
  const { mutateAsync: createPackingMaterial } = useCreatePackingMaterial()
  const { mutateAsync: updatePackingMaterial } = useUpdatePackingMaterial()
  const { mutateAsync: deletePackingMaterial } = useDeletePackingMaterial()
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()

  const categoryOptions = categories.map(c => ({ label: c.name, value: String(c.id) }))
  const uomOptions = uoms.map(u => ({ label: u.name, value: String(u.id) }))

  return (
    <SimpleMasterList<PackingMaterial>
      title="Packing Material"
      breadcrumbParent={{ label: 'Items', href: '/masters/items' }}
      breadcrumbLabel="Packing Material"
      totalLabel="packing materials"
      addButtonLabel="Add Packing Material"
      data={packingMaterials}
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
            name="categoryId"
            fieldType="select"
            options={categoryOptions}
            rules={[{ required: true, message: 'Category is required' }]}
          />
          <FormField
            label="UOM"
            name="uomId"
            fieldType="select"
            options={uomOptions}
            rules={[{ required: true, message: 'UOM is required' }]}
          />
          <FormField label="Price" name="price" fieldType="number" />
        </>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          name: values.name as string,
          categoryId: values.categoryId as string,
          category: categoryOptions.find(o => o.value === values.categoryId)?.label ?? '',
          uomId: values.uomId as string,
          uom: uomOptions.find(o => o.value === values.uomId)?.label ?? '',
          price: values.price as number | undefined,
        }
        if (editing) {
          await updatePackingMaterial({ id: editing.id, payload })
        } else {
          await createPackingMaterial(payload)
        }
      }}
      onDelete={async record => {
        await deletePackingMaterial(record.id)
      }}
    />
  )
}
