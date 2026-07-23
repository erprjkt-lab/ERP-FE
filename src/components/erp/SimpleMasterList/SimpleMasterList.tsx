import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Space, Tooltip } from 'antd'
import type { FormInstance, TableColumnsType } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'

export interface SimpleMasterListProps<T extends { id: string }> {
  title: string
  breadcrumbParent: { label: string; href?: string }
  breadcrumbLabel: string
  totalLabel: string
  addButtonLabel: string
  data: T[]
  loading?: boolean
  columns: TableColumnsType<T>
  renderFields: (form: FormInstance) => ReactNode
  getInitialValues?: (record: T) => Record<string, unknown>
  onSubmit: (values: Record<string, unknown>, editing: T | null) => Promise<void>
  onDelete: (record: T) => Promise<void>
}

export function SimpleMasterList<T extends { id: string }>({
  title,
  breadcrumbParent,
  breadcrumbLabel,
  totalLabel,
  addButtonLabel,
  data,
  loading,
  columns,
  renderFields,
  getInitialValues,
  onSubmit,
  onDelete,
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
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await onSubmit(values, editing)
      message.success(`${breadcrumbLabel} ${editing ? 'updated' : 'created'} successfully`)
      setOpen(false)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
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
          message.error(error instanceof Error ? error.message : 'Something went wrong')
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={title}
        breadcrumbs={[breadcrumbParent, { label: breadcrumbLabel }]}
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

      <Modal
        title={editing ? `Edit ${breadcrumbLabel}` : addButtonLabel}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          {renderFields(form)}
        </Form>
      </Modal>
    </div>
  )
}
