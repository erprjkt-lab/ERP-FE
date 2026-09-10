import { HolderOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { App, Button, Card, Col, Form, Row, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useFinishedGood } from '@/modules/masters/hooks/useFinishedGoods'
import { useDefineItemProcessRoute, useItemProcessRoute } from '../hooks/useItemProcessRoute'
import { useProcesses } from '../hooks/useProcesses'

interface StepFormValue {
  processId?: string
  cycleTimeSeconds?: number
  isOptional?: boolean
}

interface SortableStepRowProps {
  id: number
  index: number
  fieldName: number
  processOptions: { label: string; value: string }[]
  onRemove: () => void
}

// Drag identity uses Form.List's `field.key`, not `field.name` — `key` stays
// attached to the same logical row across reorders while `name` is just the
// row's current position, which would make dnd-kit's ids shift mid-drag.
const SortableStepRow: FC<SortableStepRowProps> = ({
  id,
  index,
  fieldName,
  processOptions,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <Row
      ref={setNodeRef}
      gutter={12}
      align="middle"
      style={{
        marginBottom: 8,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: 'relative',
        background: isDragging ? '#FAFAF7' : undefined,
      }}
    >
      <Col flex="0 0 32px" style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)' }}>
        {index + 1}
      </Col>
      <Col
        flex="0 0 28px"
        style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)', cursor: 'grab' }}
        {...attributes}
        {...listeners}
      >
        <HolderOutlined />
      </Col>
      <Col flex="1 1 260px">
        <FormField
          name={[fieldName, 'processId']}
          fieldType="select"
          placeholder="Select process"
          options={processOptions}
          rules={[{ required: true, message: 'Process is required' }]}
          style={{ marginBottom: 0 }}
        />
      </Col>
      <Col flex="0 0 160px">
        <FormField
          name={[fieldName, 'cycleTimeSeconds']}
          fieldType="number"
          placeholder="Seconds"
          style={{ marginBottom: 0 }}
        />
      </Col>
      <Col flex="0 0 110px">
        <FormField
          name={[fieldName, 'isOptional']}
          fieldType="switch"
          valuePropName="checked"
          style={{ marginBottom: 0 }}
        />
      </Col>
      <Col flex="0 0 40px">
        <Button icon={<MinusCircleOutlined />} size="small" danger onClick={onRemove} />
      </Col>
    </Row>
  )
}

export const ItemProcessRouteForm: FC = () => {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<{ steps: StepFormValue[] }>()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const { data: finishedGood } = useFinishedGood(itemId)
  const { data: processes = [] } = useProcesses()
  const { data: steps, isLoading } = useItemProcessRoute(itemId)
  const { mutateAsync: defineRoute, isPending: saving } = useDefineItemProcessRoute(itemId)

  const processOptions = processes.map(p => ({ label: p.processName, value: p.id }))

  useEffect(() => {
    if (steps.length > 0) {
      form.setFieldsValue({
        steps: steps.map(step => ({
          processId: step.processId,
          cycleTimeSeconds: step.cycleTimeSeconds,
          isOptional: step.isOptional,
        })),
      })
    }
    // steps is a freshly-mapped array every render (useItemProcessRoute maps
    // the query result each call) — depend on itemId + length instead so
    // this doesn't stomp in-progress edits on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, steps.length])

  const handleFinish = async (values: { steps?: StepFormValue[] }) => {
    const stepValues = values.steps ?? []
    if (stepValues.length === 0) {
      message.error('Add at least one step before saving')
      return
    }

    try {
      await defineRoute(
        stepValues.map(step => ({
          process_id: Number(step.processId),
          cycle_time_seconds: step.cycleTimeSeconds ?? null,
          is_optional: step.isOptional ?? false,
        })),
      )
      message.success('Item process route saved successfully')
      navigate('/production/bom')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title="Item Process Route"
        subtitle={finishedGood ? `${finishedGood.code} · ${finishedGood.name}` : undefined}
        breadcrumbs={[
          { label: 'Production' },
          { label: 'BOM', href: '/production/bom' },
          { label: 'Process Route' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/production/bom')}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Save Route
            </Button>
          </Space>
        }
      />

      <Card loading={isLoading}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <FormSection
            title="Process Steps"
            description="Drag a row by its handle to reorder. Saving replaces this item's active route — the previous one is kept as history."
          >
            <Form.List name="steps">
              {(fields, { add, remove, move }) => {
                const ids = fields.map(field => field.key)

                const handleDragEnd = ({ active, over }: DragEndEvent) => {
                  if (!over || active.id === over.id) return
                  const oldIndex = ids.indexOf(Number(active.id))
                  const newIndex = ids.indexOf(Number(over.id))
                  if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex)
                }

                return (
                  <>
                    {fields.length > 0 && (
                      <Row gutter={12} style={{ marginBottom: 4 }}>
                        <Col flex="0 0 32px" />
                        <Col flex="0 0 28px" />
                        <Col flex="1 1 260px">
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Process
                          </Typography.Text>
                        </Col>
                        <Col flex="0 0 160px">
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Cycle Time (sec)
                          </Typography.Text>
                        </Col>
                        <Col flex="0 0 110px">
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Optional
                          </Typography.Text>
                        </Col>
                        <Col flex="0 0 40px" />
                      </Row>
                    )}
                    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        {fields.map((field, index) => (
                          <SortableStepRow
                            key={field.key}
                            id={field.key}
                            index={index}
                            fieldName={field.name}
                            processOptions={processOptions}
                            onRemove={() => remove(field.name)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ isOptional: false })}
                    >
                      Add Step
                    </Button>
                  </>
                )
              }}
            </Form.List>
          </FormSection>
        </Form>
      </Card>
    </div>
  )
}
