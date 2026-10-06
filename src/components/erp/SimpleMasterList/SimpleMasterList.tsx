import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Space, Tooltip } from 'antd'
import type { FormInstance, TableColumnsType } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { getErrorMessage } from '@/api/client'

export interface SimpleMasterListProps<T extends { id: string }> {
  title?: string
  subtitle?: string
  breadcrumbParent?: { label: string; href?: string }
  breadcrumbLabel: string
  totalLabel: string
  addButtonLabel: string
  modalWidth?: number
  data: T[]
  loading?: boolean
  columns: TableColumnsType<T>
  renderFields: (form: FormInstance) => ReactNode
  getInitialValues?: (record: T) => Record<string, unknown>
  onSubmit: (values: Record<string, unknown>, editing: T | null) => Promise<void>
  onDelete: (record: T) => Promise<void>
  /** Drops the PageHeader/Card page chrome for use inside another drawer. */
  embedded?: boolean
}

export function SimpleMasterList<T extends { id: string }>({
  title,
  subtitle,
  breadcrumbParent,
  breadcrumbLabel,
  totalLabel,
  addButtonLabel,
  modalWidth,
  data,
  loading,
  columns,
  renderFields,
  getInitialValues,
  onSubmit,
  onDelete,
  embedded = false,
}: SimpleMasterListProps<T>) {
  const { modal, message } = App.useApp()
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (record: T) => {
    setEditing(record)
    form.resetFields()
    form.setFieldsValue(getInitialValues ? getInitialValues(record) : record)
    setOpen(true)
  }

  const handleOk = async () => {
    let values: Record<string, unknown>
    try {
      values = await form.validateFields()
    } catch {
      // Field-level errors are already shown inline by the Form itself.
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(values, editing)
      message.success(`${breadcrumbLabel} ${editing ? 'updated' : 'created'} successfully`)
      setOpen(false)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (record: T) => {
    modal.confirm({
      title: `Delete this ${breadcrumbLabel.toLowerCase()}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await onDelete(record)
          message.success(`${breadcrumbLabel} deleted successfully`)
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columnsWithActions: TableColumnsType<T> = [
    ...columns,
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const formDrawer = (
    <FormDrawer
      title={editing ? `Edit ${breadcrumbLabel}` : addButtonLabel}
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={handleOk}
      submitting={submitting}
      width={modalWidth}
    >
      <Form form={form} layout="vertical">
        {renderFields(form)}
      </Form>
    </FormDrawer>
  )

  // embedded is fixed for an instance's whole lifetime (never toggles), so
  // branching with an early return — rather than a ternary inside one JSX
  // tree — keeps the normal page's tree exactly as it was before this prop
  // existed, instead of risking a reconciliation/effect-order shift from
  // antd's Tooltip portals sitting one level deeper in a conditional.
  if (embedded) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {addButtonLabel}
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <DataTable<T>
            columns={columnsWithActions}
            dataSource={data}
            rowKey="id"
            loading={loading}
            totalLabel={totalLabel}
          />
        </Card>
        {formDrawer}
      </>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={title ?? ''}
        subtitle={subtitle}
        breadcrumbs={[breadcrumbParent ?? { label: '' }, { label: breadcrumbLabel }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {addButtonLabel}
          </Button>
        }
      />

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<T>
          columns={columnsWithActions}
          dataSource={data}
          rowKey="id"
          loading={loading}
          totalLabel={totalLabel}
          fillHeight
        />
      </Card>

      {formDrawer}
    </div>
  )
}
