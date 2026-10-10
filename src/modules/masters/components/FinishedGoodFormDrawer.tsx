import { App, Form } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { UploadField } from '@/components/ui/UploadField'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useCustomers } from '../hooks/useCustomers'
import {
  useCreateFinishedGood,
  useFinishedGood,
  useUpdateFinishedGood,
} from '../hooks/useFinishedGoods'
import { useHsnCodes } from '../hooks/useHsnCodes'
import { useItemCategories } from '../hooks/useItemCategories'
import { useMaterialGrades } from '../hooks/useMaterialGrades'
import { useUoms } from '../hooks/useUoms'
import type { FinishedGoodInput } from '../store/mastersStore'
import { getErrorMessage } from '@/api/client'

const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }

export interface FinishedGoodFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to add a new finished good; pass an id to edit that one. */
  finishedGoodId?: string
}

export const FinishedGoodFormDrawer: FC<FinishedGoodFormDrawerProps> = ({
  open,
  onClose,
  finishedGoodId,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!finishedGoodId

  const { data: finishedGood } = useFinishedGood(finishedGoodId)
  const { data: customers = [] } = useCustomers()
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()
  const { data: hsnCodes = [] } = useHsnCodes()
  const { data: materialGrades = [] } = useMaterialGrades()
  const { mutateAsync: createFinishedGood, isPending: creating } = useCreateFinishedGood()
  const { mutateAsync: updateFinishedGood, isPending: updating } = useUpdateFinishedGood()

  const customerOptions = customers.map(c => ({ label: c.name, value: c.id }))
  const categoryOptions = categories.map(c => ({ label: c.name, value: String(c.id) }))
  const uomOptions = uoms.map(u => ({ label: u.name, value: String(u.id) }))
  const hsnCodeOptions = hsnCodes.map(h => ({ label: `${h.hsn} (${h.gstRate}%)`, value: h.id }))
  const materialGradeOptions = materialGrades.map(m => ({
    label: m.material_grade,
    value: String(m.id),
  }))

  useEffect(() => {
    if (!open) return
    if (isEdit && finishedGood) {
      form.setFieldsValue({
        code: finishedGood.code,
        name: finishedGood.name,
        categoryId: finishedGood.categoryId ?? undefined,
        brand: finishedGood.brand,
        uomId: finishedGood.uomId ?? undefined,
        alternateUomId: finishedGood.alternateUomId ?? undefined,
        hsnCode: finishedGood.hsnCode,
        gstPercent: finishedGood.gstPercent,
        description: finishedGood.description,
        status: finishedGood.status,
        imageUrl: finishedGood.imageUrl,
        customerId: finishedGood.customerId ?? undefined,
        customerPartNo: finishedGood.customerPartNo,
        drawingNo: finishedGood.drawingNo,
        drawingRevision: finishedGood.drawingRevision,
        drawingFileName: finishedGood.drawingFileName,
        materialGradeId: finishedGood.materialGradeId ?? undefined,
        weight: finishedGood.weight,
        price: finishedGood.price,
      })
    } else if (!isEdit) {
      form.resetFields()
    }
    // finishedGood is a freshly-composed object every render (useFinishedGoods
    // maps the store array each call) — depend on the stable id instead so
    // this doesn't stomp in-progress edits on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, finishedGood?.id, form])

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
      customerId: (values.customerId as string | undefined) ?? null,
      customerName: customerOptions.find(o => o.value === values.customerId)?.label,
      customerPartNo: values.customerPartNo as string | undefined,
      drawingNo: values.drawingNo as string | undefined,
      drawingRevision: values.drawingRevision as string | undefined,
      drawingFileName: values.drawingFileName as string | undefined,
      materialGradeId: values.materialGradeId as string | undefined,
      materialGrade: materialGradeOptions.find(o => o.value === values.materialGradeId)?.label,
      weight: values.weight as number | undefined,
      price: values.price as number | undefined,
    } satisfies FinishedGoodInput

    try {
      if (isEdit && finishedGood) {
        await updateFinishedGood({ id: finishedGood.id, payload })
      } else {
        await createFinishedGood(payload)
      }
      message.success(`Finished good ${isEdit ? 'updated' : 'created'} successfully`)
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={isEdit ? 'Edit Finished Good' : 'Add Finished Good'}
      status={isEdit ? (finishedGood?.status ?? 'active') : undefined}
      open={open}
      width={720}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creating || updating}
      submitText={isEdit ? 'Update Finished Good' : 'Save Finished Good'}
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
            <FormField
              label="HSN Code"
              name="hsnCode"
              fieldType="select"
              options={hsnCodeOptions}
            />
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

        <FormSection title="Customer & Drawing">
          <div style={gridStyle}>
            <FormField
              label="Customer"
              name="customerId"
              fieldType="select"
              options={customerOptions}
            />
            <FormField label="Customer Part No" name="customerPartNo" />
            <FormField label="Drawing No" name="drawingNo" />
            <FormField label="Drawing Revision" name="drawingRevision" />
          </div>
          <FormField label="Drawing File" name="drawingFileName">
            <UploadField mode="file" accept=".pdf,.dwg,.dxf" />
          </FormField>
        </FormSection>

        <FormSection title="Specs">
          <div style={gridStyle}>
            <FormField
              label="Material Grade"
              name="materialGradeId"
              fieldType="select"
              options={materialGradeOptions}
            />
            <FormField label="Weight (kg)" name="weight" fieldType="number" />
            <FormField label="Price" name="price" fieldType="number" />
          </div>
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
