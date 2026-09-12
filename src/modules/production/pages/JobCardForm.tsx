import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Alert, Button, Card, Col, Form, Row, Space, Tag, Typography } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useCustomers } from '@/modules/masters/hooks/useCustomers'
import { useFinishedGoods } from '@/modules/masters/hooks/useFinishedGoods'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import { MANUFACTURING_ROUTE_CODE, useCreateJobCard } from '../hooks/useJobCards'
import { useItemProcessRoute } from '../hooks/useItemProcessRoute'
import { useProcesses } from '../hooks/useProcesses'

const ROUTE_TYPE_OPTIONS = [
  { label: 'Standard', value: 'standard' },
  { label: 'Rework', value: 'rework' },
  { label: 'Sample', value: 'sample' },
]

interface RouteStepValue {
  processId?: string
}

interface JobCardFormValues {
  jobCardDate: { format: (fmt: string) => string }
  targetDate: { format: (fmt: string) => string }
  itemId: string
  itemRevision?: string
  orderedQty: number
  outputLocationId: string
  partyId?: string
  manufacturingRoute: 'standard' | 'rework' | 'sample'
  remark?: string
  overrideRoute?: boolean
  routeSteps?: RouteStepValue[]
}

export const JobCardForm: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<JobCardFormValues>()

  const { data: finishedGoods = [] } = useFinishedGoods()
  const { data: locations = [] } = useLocations()
  const { data: customers = [] } = useCustomers()
  const { data: processes = [] } = useProcesses()
  const { mutateAsync: createJobCard, isPending: saving } = useCreateJobCard()

  const itemId = Form.useWatch('itemId', form) as string | undefined
  const overrideRoute = Form.useWatch('overrideRoute', form) as boolean | undefined
  const { data: activeRoute, isLoading: loadingRoute } = useItemProcessRoute(itemId)

  const itemOptions = finishedGoods.map(item => ({
    label: `${item.code} · ${item.name}`,
    value: item.id,
  }))
  const locationOptions = locations.map(loc => ({ label: loc.name, value: loc.id }))
  const customerOptions = (customers ?? []).map(c => ({ label: c.name, value: c.id }))
  const processOptions = processes.map(p => ({ label: p.processName, value: p.id }))

  const handleFinish = async (values: JobCardFormValues) => {
    if (!overrideRoute && itemId && !loadingRoute && activeRoute.length === 0) {
      message.error('This item has no active process route. Turn on route override to continue.')
      return
    }
    if (overrideRoute && (!values.routeSteps || values.routeSteps.length === 0)) {
      message.error('Add at least one process step for the route override')
      return
    }

    try {
      await createJobCard({
        job_card_date: values.jobCardDate.format('YYYY-MM-DD'),
        target_date: values.targetDate.format('YYYY-MM-DD'),
        party_id: values.partyId ? Number(values.partyId) : null,
        item_id: Number(values.itemId),
        item_revision: values.itemRevision || undefined,
        ordered_qty: values.orderedQty,
        manufacturing_route: MANUFACTURING_ROUTE_CODE[values.manufacturingRoute],
        output_location_id: Number(values.outputLocationId),
        remark: values.remark || undefined,
        route: overrideRoute
          ? (values.routeSteps ?? []).map(step => ({ process_id: Number(step.processId) }))
          : undefined,
      })
      message.success('Job card created successfully')
      navigate('/production/work-orders')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Job Card"
        breadcrumbs={[
          { label: 'Production' },
          { label: 'Work Order (Jobcard)', href: '/production/work-orders' },
          { label: 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/production/work-orders')}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Save Job Card
            </Button>
          </Space>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ manufacturingRoute: 'standard', overrideRoute: false }}
        >
          <FormSection title="Basic Info">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Item"
                  name="itemId"
                  fieldType="select"
                  options={itemOptions}
                  placeholder="Select finished good"
                  rules={[{ required: true, message: 'Item is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField label="Item Revision" name="itemRevision" />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Job Card Date"
                  name="jobCardDate"
                  fieldType="date"
                  rules={[{ required: true, message: 'Job card date is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Target Date"
                  name="targetDate"
                  fieldType="date"
                  rules={[{ required: true, message: 'Target date is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Ordered Qty"
                  name="orderedQty"
                  fieldType="number"
                  rules={[{ required: true, message: 'Ordered quantity is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Output Location"
                  name="outputLocationId"
                  fieldType="select"
                  options={locationOptions}
                  placeholder="Where finished stock lands"
                  rules={[{ required: true, message: 'Output location is required' }]}
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Customer / Party"
                  name="partyId"
                  fieldType="select"
                  options={customerOptions}
                  placeholder="Optional"
                />
              </Col>
              <Col xs={24} sm={12} md={12}>
                <FormField
                  label="Route Type"
                  name="manufacturingRoute"
                  fieldType="select"
                  options={ROUTE_TYPE_OPTIONS}
                />
              </Col>
            </Row>
            <FormField label="Remark" name="remark" fieldType="textarea" />
          </FormSection>

          <FormSection
            title="Process Route"
            description="By default this job card follows the item's active process route. Turn on override only for rework or sample builds that need a different sequence."
          >
            {itemId && !loadingRoute && (
              <div style={{ marginBottom: 16 }}>
                {activeRoute.length > 0 ? (
                  <Space size={[8, 8]} wrap>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Active route:
                    </Typography.Text>
                    {activeRoute.map((step, index) => (
                      <Tag key={step.id}>
                        {index + 1}. {step.processName}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    message="This item has no active process route defined. You must override the route below to create this job card."
                  />
                )}
              </div>
            )}

            <FormField
              label="Override process route"
              name="overrideRoute"
              fieldType="switch"
              valuePropName="checked"
            />

            {overrideRoute && (
              <Form.List name="routeSteps">
                {(fields, { add, remove, move }) => (
                  <>
                    {fields.map((field, index) => (
                      <Row gutter={12} key={field.key} align="middle" style={{ marginBottom: 8 }}>
                        <Col
                          flex="0 0 32px"
                          style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}
                        >
                          {index + 1}
                        </Col>
                        <Col flex="1 1 260px">
                          <FormField
                            name={[field.name, 'processId']}
                            fieldType="select"
                            placeholder="Select process"
                            options={processOptions}
                            rules={[{ required: true, message: 'Process is required' }]}
                            style={{ marginBottom: 0 }}
                          />
                        </Col>
                        <Col flex="0 0 96px">
                          <Space size="small">
                            <Button
                              size="small"
                              disabled={index === 0}
                              onClick={() => move(index, index - 1)}
                            >
                              ↑
                            </Button>
                            <Button
                              size="small"
                              disabled={index === fields.length - 1}
                              onClick={() => move(index, index + 1)}
                            >
                              ↓
                            </Button>
                            <Button
                              icon={<MinusCircleOutlined />}
                              size="small"
                              danger
                              onClick={() => remove(field.name)}
                            />
                          </Space>
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({})}>
                      Add Step
                    </Button>
                  </>
                )}
              </Form.List>
            )}
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}
