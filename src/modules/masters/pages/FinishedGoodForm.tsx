import { App, Button, Card, Col, Form, Row, Space } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { UploadField } from '@/components/ui/UploadField'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useCustomers } from '../hooks/useCustomers'
import {
  useCreateFinishedGood,
  useFinishedGood,
  useUpdateFinishedGood,
} from '../hooks/useFinishedGoods'
import { useItemCategories } from '../hooks/useItemCategories'
import { useMaterialGrades } from '../hooks/useMaterialGrades'
import { useUoms } from '../hooks/useUoms'
import type { FinishedGoodInput } from '../store/mastersStore'

export const FinishedGoodForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: finishedGood } = useFinishedGood(id)
  const { data: customers = [] } = useCustomers()
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()
  const { data: materialGrades = [] } = useMaterialGrades()
  const { mutateAsync: createFinishedGood, isPending: creating } = useCreateFinishedGood()
  const { mutateAsync: updateFinishedGood, isPending: updating } = useUpdateFinishedGood()

  const customerOptions = customers.map(c => ({ label: c.name, value: c.id }))
  const categoryOptions = categories.map(c => ({ label: c.name, value: String(c.id) }))
  const uomOptions = uoms.map(u => ({ label: u.name, value: String(u.id) }))
  const materialGradeOptions = materialGrades.map(m => ({
    label: m.material_grade,
    value: String(m.id),
  }))

  useEffect(() => {
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
    }
    // finishedGood is a freshly-composed object every render (useFinishedGoods
    // maps the store array each call) — depend on the stable id instead so
    // this doesn't stomp in-progress edits on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, finishedGood?.id, form])

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
      navigate('/masters/finished-goods')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Finished Good' : 'Add Finished Good'}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Finished Goods', href: '/masters/finished-goods' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/masters/finished-goods')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Finished Good
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

          <FormSection title="Customer & Drawing">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Customer"
                  name="customerId"
                  fieldType="select"
                  options={customerOptions}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Customer Part No" name="customerPartNo" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Drawing No" name="drawingNo" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Drawing Revision" name="drawingRevision" />
              </Col>
            </Row>
            <FormField label="Drawing File" name="drawingFileName">
              <UploadField mode="file" accept=".pdf,.dwg,.dxf" />
            </FormField>
          </FormSection>

          <FormSection title="Specs">
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
                <FormField label="Weight" name="weight" fieldType="number" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Price" name="price" fieldType="number" />
              </Col>
            </Row>
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
