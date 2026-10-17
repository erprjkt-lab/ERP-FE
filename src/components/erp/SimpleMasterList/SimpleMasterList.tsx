import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Form } from 'antd'
import type { FormInstance, FormProps, TableColumnsType, TableProps } from 'antd'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePagePermission } from '@/hooks/usePagePermission'
import { useModulePermission } from '@/store/permissionStore'
import type { TableActionItem } from '@/components/ui'
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
  /** Own the form from outside when a field has to react to another one;
   *  left out, the list makes its own. */
  form?: FormInstance
  /** Passed straight to the inner Form — for fields that derive from another
   *  (e.g. GST % following the selected HSN code). */
  onValuesChange?: FormProps['onValuesChange']
  getInitialValues?: (record: T) => Record<string, unknown>
  onSubmit: (values: Record<string, unknown>, editing: T | null) => Promise<void>
  onDelete: (record: T) => Promise<void>
  /** Reshapes a row's actions — drop the defaults, disable them, or add more.
   *  Left out, every row gets the usual Edit/Delete pair. */
  rowActions?: (record: T, defaults: TableActionItem[]) => TableActionItem[]
  /** Server-side paging: pass DataTable's pagination config straight through.
   *  Left out, the table pages through whatever rows it was given. */
  pagination?: TableProps<T>['pagination']
  /** Drops the PageHeader/Card page chrome for use inside another drawer. */
  embedded?: boolean
  /** The rbac module whose permissions gate the add/edit/delete actions. Defaults
   *  to whatever module backs the current route — pass it only when an embedded
   *  list belongs to a different module than the page hosting it (e.g. the
   *  inspection-parameters drawer opened from the BOM page). */
  moduleKey?: string
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
  form: formProp,
  onValuesChange,
  getInitialValues,
  onSubmit,
  onDelete,
  rowActions,
  pagination,
  embedded = false,
  moduleKey,
}: SimpleMasterListProps<T>) {
  const { modal, message } = App.useApp()
  const route = usePagePermission()
  const override = useModulePermission(moduleKey ?? '')
  const { canWrite, canModify, canDelete } = moduleKey ? override : route
  const [form] = Form.useForm(formProp)
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

  const getMasterActions = (record: T): TableActionItem[] => {
    const defaults: TableActionItem[] = [
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        variant: 'primary',
        hidden: !canModify,
        onClick: () => openEdit(record),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        variant: 'danger',
        danger: true,
        hidden: !canDelete,
        onClick: () => handleDelete(record),
      },
    ]

    return rowActions ? rowActions(record, defaults) : defaults
  }

  const formDrawer = (
    <FormDrawer
      title={editing ? `Edit ${breadcrumbLabel}` : addButtonLabel}
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={handleOk}
      submitting={submitting}
      width={modalWidth}
    >
      <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
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
        {canWrite && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {addButtonLabel}
            </Button>
          </div>
        )}
        <Card styles={{ body: { padding: 0 } }}>
          <DataTable<T>
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            totalLabel={totalLabel}
            pagination={pagination}
            rowActions={getMasterActions}
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
          canWrite ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {addButtonLabel}
            </Button>
          ) : undefined
        }
      />

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<T>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          totalLabel={totalLabel}
          pagination={pagination}
          fillHeight
          rowActions={getMasterActions}
        />
      </Card>

      {formDrawer}
    </div>
  )
}
