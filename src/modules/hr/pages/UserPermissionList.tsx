import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Checkbox, Col, Empty, Row, Select, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC, Key } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useEmployees } from '../hooks/useEmployees'
import {
  useEmployeeMenuPermissions,
  useSaveEmployeeMenuPermissions,
} from '../hooks/useEmployeePermissions'
import {
  MENU_ACTIONS,
  changedMenus,
  flattenRows,
  permissionBearingRows,
  selectionSummary,
} from '../utils/menuPermissions'
import type { MenuAction, MenuPermissionRow } from '../utils/menuPermissions'

// Placeholder for an action a module doesn't support — muted so the eye skips it.
const NotApplicable: FC = () => (
  <Typography.Text style={{ color: 'rgba(0, 0, 0, 0.18)' }}>—</Typography.Text>
)

const ACTION_LABELS: Record<MenuAction, string> = {
  read: 'Read',
  write: 'Write',
  modify: 'Modify',
  delete: 'Delete',
  approve: 'Approve',
}

export const UserPermissionList: FC = () => {
  const { message } = App.useApp()
  const [employeeId, setEmployeeId] = useState<string>()
  // Only the menus the user actually touched; everything else falls back to what the
  // BE reports as granted, so switching employee just means clearing this.
  const [edits, setEdits] = useState<Record<number, string[]>>({})

  const { data: employees = [], isLoading: employeesLoading } = useEmployees()
  const { data: rows, isLoading, isFetching } = useEmployeeMenuPermissions(employeeId)
  const { mutateAsync: savePermissions, isPending: saving } =
    useSaveEmployeeMenuPermissions(employeeId)

  const pending = changedMenus(rows, edits)
  const { selected: granted, total: totalAvailable } = selectionSummary(
    flattenRows(rows).filter(row => row.availableActions.length > 0),
    edits,
  )

  // Folders are expanded whenever a new tree arrives, but stay collapsible afterwards.
  const parentKeys = flattenRows(rows)
    .filter(row => row.children?.length)
    .map(row => row.key)
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
  const [lastParentKeys, setLastParentKeys] = useState('')
  if (parentKeys.join() !== lastParentKeys) {
    setLastParentKeys(parentKeys.join())
    setExpandedKeys(parentKeys)
  }

  // Ticks or clears every available action on these rows at once — used by the "All"
  // column, on a single menu row or on a folder (where it covers everything inside).
  const setAll = (targets: MenuPermissionRow[], checked: boolean) => {
    setEdits(prev => {
      const next = { ...prev }
      for (const target of targets) next[target.key] = checked ? [...target.availableActions] : []
      return next
    })
  }

  const toggle = (row: MenuPermissionRow, action: MenuAction, checked: boolean) => {
    const current = edits[row.key] ?? row.grantedActions
    setEdits(prev => ({
      ...prev,
      [row.key]: checked ? [...current, action] : current.filter(a => a !== action),
    }))
  }

  const handleSave = async () => {
    try {
      await savePermissions({ menus: pending })
      setEdits({})
      message.success(
        `Permissions updated for ${pending.length} menu${pending.length === 1 ? '' : 's'}`,
      )
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<MenuPermissionRow> = [
    { title: 'Menu', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'All',
      key: 'all',
      width: 72,
      align: 'center' as const,
      className: 'erp-permission-divider-cell',
      onHeaderCell: () => ({ className: 'erp-permission-divider-cell' }),
      render: (_: unknown, row: MenuPermissionRow) => {
        const targets = permissionBearingRows(row)
        const { selected, total } = selectionSummary(targets, edits)
        if (total === 0) return <NotApplicable />
        return (
          <Checkbox
            checked={selected === total}
            indeterminate={selected > 0 && selected < total}
            onChange={e => setAll(targets, e.target.checked)}
          />
        )
      },
    },
    ...MENU_ACTIONS.map((action, index) => ({
      title: ACTION_LABELS[action],
      key: action,
      width: 96,
      align: 'center' as const,
      ...(index === 0
        ? {
            className: 'erp-permission-divider-cell',
            onHeaderCell: () => ({ className: 'erp-permission-divider-cell' }),
          }
        : {}),
      render: (_: unknown, row: MenuPermissionRow) =>
        row.availableActions.includes(action) ? (
          <Checkbox
            checked={(edits[row.key] ?? row.grantedActions).includes(action)}
            onChange={e => toggle(row, action, e.target.checked)}
          />
        ) : (
          <NotApplicable />
        ),
    })),
  ]

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 1080,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <PageHeader
        title="Permissions"
        subtitle="Grant per-menu access for one employee. A menu only offers the actions its module supports."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Permissions' }]}
        actions={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={pending.length === 0}
            onClick={handleSave}
          >
            {pending.length > 0 ? `Save changes (${pending.length})` : 'Save changes'}
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Typography.Text type="secondary">Employee</Typography.Text>
          </Col>
          <Col xs={24} sm={16} md={10}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select an employee..."
              value={employeeId}
              loading={employeesLoading}
              onChange={value => {
                setEmployeeId(value)
                setEdits({})
              }}
              style={{ width: '100%' }}
              options={employees.map(employee => ({
                value: String(employee.id),
                label: `${employee.fullName} (${employee.employeeId})`,
              }))}
            />
          </Col>
          {employeeId && (
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Typography.Text type="secondary">
                {granted} of {totalAvailable} permissions granted
              </Typography.Text>
            </Col>
          )}
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        {employeeId ? (
          <DataTable<MenuPermissionRow>
            columns={columns}
            dataSource={rows}
            rowKey="key"
            loading={isLoading || isFetching}
            pagination={false}
            size="small"
            fillHeight
            className="erp-permission-table"
            rowClassName={row =>
              row.availableActions.length === 0 ? 'erp-permission-group-row' : ''
            }
            expandable={{
              expandedRowKeys: expandedKeys,
              onExpandedRowsChange: keys => setExpandedKeys([...keys]),
            }}
          />
        ) : (
          <Empty
            description="Select an employee to see their menu permissions."
            style={{ padding: '64px 0' }}
          />
        )}
      </Card>
    </div>
  )
}
