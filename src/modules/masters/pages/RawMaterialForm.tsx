import { App, Button, Card, Col, Form, Row, Space } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
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

export const RawMaterialForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: rawMaterial } = useRawMaterial(id)
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
    }
    // rawMaterial is a freshly-composed object every render (useRawMaterials
    // maps the store array each call) — depend on the stable id instead so
    // this doesn't stomp in-progress edits on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, rawMaterial?.id, form])

  const handleFinish = async (values: Record<string, unknown>) => {
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
      navigate('/masters/raw-materials')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Raw Material' : 'Add Raw Material'}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Raw Materials', href: '/masters/raw-materials' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/masters/raw-materials')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Raw Material
            </Button>
          </Space>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ status: 'active' }}
        >
          <FormSection title="Basic Info">
            {isEdit && <FormField label="Item Code" name="code" disabled />}
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Item Name"
                  name="name"
                  rules={[{ required: true, message: 'Item name is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Category"
                  name="categoryId"
                  fieldType="select"
                  options={categoryOptions}
                  rules={[{ required: true, message: 'Category is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Brand" name="brand" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="UOM"
                  name="uomId"
                  fieldType="select"
                  options={uomOptions}
                  rules={[{ required: true, message: 'UOM is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Alternate UOM"
                  name="alternateUomId"
                  fieldType="select"
                  options={uomOptions}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="HSN Code" name="hsnCode" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="GST %" name="gstPercent" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Status"
                  name="status"
                  fieldType="select"
                  options={MASTER_STATUS_OPTIONS}
                />
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Description">
            <FormField label="Description" name="description" fieldType="textarea" />
          </FormSection>

          <FormSection title="Physical Specs">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Material Grade"
                  name="materialGradeId"
                  fieldType="select"
                  options={materialGradeOptions}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Material Type" name="materialType" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Shape" name="shape" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Diameter" name="diameter" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Width" name="width" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Thickness" name="thickness" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Length" name="length" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Density" name="density" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Color" name="color" />
              </Col>
            </Row>
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
      </Card>
    </div>
  )
}
