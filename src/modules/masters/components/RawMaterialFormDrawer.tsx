import { App, Form } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { UploadField } from '@/components/ui/UploadField'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useItemCategories } from '../hooks/useItemCategories'
import { useMaterialGrades } from '../hooks/useMaterialGrades'
import {
  useCreateRawMaterial,
  useRawMaterial,
  useUpdateRawMaterial,
} from '../hooks/useRawMaterials'
import { useUoms } from '../hooks/useUoms'
import type { RawMaterialInput } from '../store/mastersStore'
import { getErrorMessage } from '@/api/client'

const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }

export interface RawMaterialFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to add a new raw material; pass an id to edit that one. */
  rawMaterialId?: string
}

export const RawMaterialFormDrawer: FC<RawMaterialFormDrawerProps> = ({
  open,
  onClose,
  rawMaterialId,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!rawMaterialId

  const { data: rawMaterial } = useRawMaterial(rawMaterialId)
  const { mutateAsync: createRawMaterial, isPending: creating } = useCreateRawMaterial()
  const { mutateAsync: updateRawMaterial, isPending: updating } = useUpdateRawMaterial()
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()
  const { data: materialGrades = [] } = useMaterialGrades()

  const categoryOptions = categories.map(c => ({ label: c.name, value: String(c.id) }))
  const uomOptions = uoms.map(u => ({ label: u.name, value: String(u.id) }))
  const materialGradeOptions = materialGrades.map(m => ({
    label: m.material_grade,
    value: String(m.id),
  }))

  useEffect(() => {
    if (!open) return
    if (isEdit && rawMaterial) {
      form.setFieldsValue({
        code: rawMaterial.code,
        name: rawMaterial.name,
        categoryId: rawMaterial.categoryId ?? undefined,
        brand: rawMaterial.brand,
        uomId: rawMaterial.uomId ?? undefined,
        alternateUomId: rawMaterial.alternateUomId ?? undefined,
        hsnCode: rawMaterial.hsnCode,
        gstPercent: rawMaterial.gstPercent,
        description: rawMaterial.description,
        status: rawMaterial.status,
        imageUrl: rawMaterial.imageUrl,
        materialGradeId: rawMaterial.materialGradeId ?? undefined,
        materialType: rawMaterial.materialType,
        shape: rawMaterial.shape,
        diameter: rawMaterial.diameter,
        width: rawMaterial.width,
        thickness: rawMaterial.thickness,
        length: rawMaterial.length,
        density: rawMaterial.density,
        color: rawMaterial.color,
        price: rawMaterial.price,
      })
    } else if (!isEdit) {
      form.resetFields()
    }
    // rawMaterial is a freshly-composed object every render (useRawMaterials
    // maps the store array each call) — depend on the stable id instead so
    // this doesn't stomp in-progress edits on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, rawMaterial?.id, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    let values: Record<string, unknown>
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const payload = {
      name: values.name as string,
      categoryId: values.categoryId as string,
      category: categoryOptions.find(o => o.value === values.categoryId)?.label ?? '',
      brand: values.brand as string | undefined,
      uomId: values.uomId as string,
      uom: uomOptions.find(o => o.value === values.uomId)?.label ?? '',
      alternateUomId: values.alternateUomId as string | undefined,
      alternateUom: uomOptions.find(o => o.value === values.alternateUomId)?.label,
      hsnCode: values.hsnCode as string | undefined,
      gstPercent: values.gstPercent as number | undefined,
      description: values.description as string | undefined,
      status: values.status as 'active' | 'inactive',
      imageUrl: values.imageUrl as string | undefined,
      materialGradeId: values.materialGradeId as string | undefined,
      materialGrade: materialGradeOptions.find(o => o.value === values.materialGradeId)?.label,
      materialType: values.materialType as string | undefined,
      shape: values.shape as string | undefined,
      diameter: values.diameter as number | undefined,
      width: values.width as number | undefined,
      thickness: values.thickness as number | undefined,
      length: values.length as number | undefined,
      density: values.density as number | undefined,
      color: values.color as string | undefined,
      price: values.price as number | undefined,
    } satisfies RawMaterialInput

    try {
      if (isEdit && rawMaterial) {
        await updateRawMaterial({ id: rawMaterial.id, payload })
      } else {
        await createRawMaterial(payload)
      }
      message.success(`Raw material ${isEdit ? 'updated' : 'created'} successfully`)
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? 'Edit Raw Material' : 'Add Raw Material'}
      status={isEdit ? (rawMaterial?.status ?? 'active') : undefined}
      open={open}
      width={720}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Update Raw Material' : 'Save Raw Material'}
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'active' }}>
        <FormSection title="Basic Info">
          {isEdit && <FormField label="Item Code" name="code" disabled />}
          <div style={gridStyle}>
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
            <FormField
              label="Status"
              name="status"
              fieldType="select"
              options={MASTER_STATUS_OPTIONS}
            />
          </div>
        </FormSection>

        <FormSection title="Description">
          <FormField label="Description" name="description" fieldType="textarea" />
        </FormSection>

        <FormSection title="Physical Specs">
          <div style={gridStyle}>
            <FormField
              label="Material Grade"
              name="materialGradeId"
              fieldType="select"
              options={materialGradeOptions}
            />
            <FormField label="Material Type" name="materialType" />
            <FormField label="Shape" name="shape" />
            <FormField label="Diameter" name="diameter" fieldType="number" />
            <FormField label="Width" name="width" fieldType="number" />
            <FormField label="Thickness" name="thickness" fieldType="number" />
            <FormField label="Length" name="length" fieldType="number" />
            <FormField label="Density" name="density" fieldType="number" />
            <FormField label="Color" name="color" />
          </div>
        </FormSection>

        <FormSection title="Price">
          <FormField label="Price" name="price" fieldType="number" />
        </FormSection>

        <FormSection title="Image">
          <FormField label="Image" name="imageUrl">
            <UploadField mode="image" accept="image/*" />
          </FormField>
        </FormSection>
      </Form>
    </FormDrawer>
  )
}
