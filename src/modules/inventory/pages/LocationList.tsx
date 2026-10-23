import { StopOutlined } from '@ant-design/icons'
import { App, Tag } from 'antd'
import type { FC } from 'react'
import { usePagePermission } from '@/hooks/usePagePermission'
import { getErrorMessage } from '@/api/client'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StoreLocation } from '@/types/masters'
import {
  useCreateLocation,
  useDeactivateLocation,
  useDeleteLocation,
  useStoreLocations,
  useUpdateLocation,
} from '../hooks/useLocations'

export const LocationList: FC = () => {
  const { canModify } = usePagePermission()
  const { modal, message } = App.useApp()
  const { data: locations = [], isLoading } = useStoreLocations()
  const { mutateAsync: createLocation } = useCreateLocation()
  const { mutateAsync: updateLocation } = useUpdateLocation()
  const { mutateAsync: deactivateLocation } = useDeactivateLocation()
  const { mutateAsync: deleteLocation } = useDeleteLocation()

  const nameById = new Map(locations.map(location => [location.id, location.name]))

  // A location can sit under any other one, but never under itself — the backend
  // stores a self-referencing hierarchy where a parentless row is the warehouse.
  const parentOptions = (editingId?: string) =>
    locations
      .filter(location => location.id !== editingId && location.isActive)
      .map(location => ({ label: `${location.code} — ${location.name}`, value: location.id }))

  const confirmDeactivate = (record: StoreLocation) =>
    modal.confirm({
      title: `Deactivate ${record.name}?`,
      content: 'It stays on past records but can no longer be picked for new stock movements.',
      okText: 'Deactivate',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateLocation(record.id)
          message.success('Location deactivated')
        } catch (error) {
          // BE refuses with a 409 when the location still has children.
          message.error(getErrorMessage(error))
        }
      },
    })

  return (
    <SimpleMasterList<StoreLocation>
      title="Store Locations"
      breadcrumbParent={{ label: 'Inventory' }}
      breadcrumbLabel="Location"
      totalLabel="locations"
      addButtonLabel="Add Location"
      modalWidth={520}
      data={locations}
      loading={isLoading}
      columns={[
        { title: 'Code', dataIndex: 'code', key: 'code', width: 140 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
          title: 'Parent',
          dataIndex: 'parentLocationId',
          key: 'parentLocationId',
          render: parentId =>
            parentId ? (nameById.get(String(parentId)) ?? '—') : <Tag>Warehouse</Tag>,
        },
        {
          title: 'Status',
          key: 'status',
          width: 110,
          render: (_, record) => (
            <>
              <StatusBadge status={record.isActive ? 'active' : 'inactive'} />
              {record.isSystem && <Tag style={{ marginInlineStart: 6 }}>System</Tag>}
            </>
          ),
        },
      ]}
      renderFields={() => (
        <>
          <FormField
            label="Code"
            name="code"
            rules={[{ required: true, message: 'Code is required' }, { max: 50 }]}
          />
          <FormField
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }, { max: 150 }]}
          />
          <FormField
            label="Parent Location"
            name="parentLocationId"
            fieldType="select"
            placeholder="Leave empty to create a warehouse"
            options={parentOptions()}
          />
        </>
      )}
      getInitialValues={record => ({
        code: record.code,
        name: record.name,
        parentLocationId: record.parentLocationId ?? undefined,
      })}
      // System rows (location_type > 0) are locked backend-side — every write to
      // them answers 409, so they get no actions rather than a button that fails.
      rowActions={(record, defaults) =>
        record.isSystem
          ? []
          : [
              ...defaults,
              {
                key: 'deactivate',
                label: 'Deactivate',
                icon: <StopOutlined />,
                hidden: !record.isActive || !canModify,
                onClick: () => confirmDeactivate(record),
              },
            ]
      }
      onSubmit={async (values, editing) => {
        const parentLocationId = values.parentLocationId as string | undefined
        const payload = {
          code: values.code as string,
          name: values.name as string,
          parent_location_id: parentLocationId ? Number(parentLocationId) : null,
        }
        if (editing) {
          await updateLocation({ id: editing.id, payload })
        } else {
          await createLocation(payload)
        }
      }}
      onDelete={async record => {
        await deleteLocation(record.id)
      }}
    />
  )
}
