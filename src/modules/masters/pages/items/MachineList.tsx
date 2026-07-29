import dayjs from 'dayjs'
import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { Machine } from '@/types/masters'
import {
  useCreateMachine,
  useDeleteMachine,
  useMachines,
  useUpdateMachine,
} from '../../hooks/useMachines'

const DATE_FORMAT = 'YYYY-MM-DD'

export const MachineList: FC = () => {
  const { data: machines = [], isLoading } = useMachines()
  const { mutateAsync: createMachine } = useCreateMachine()
  const { mutateAsync: updateMachine } = useUpdateMachine()
  const { mutateAsync: deleteMachine } = useDeleteMachine()

  return (
    <SimpleMasterList<Machine>
      title="Machine"
      breadcrumbParent={{ label: 'Items', href: '/masters/items' }}
      breadcrumbLabel="Machine"
      totalLabel="machines"
      addButtonLabel="Add Machine"
      modalWidth={720}
      data={machines}
      loading={isLoading}
      columns={[
        { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Make', dataIndex: 'machineMake', key: 'machineMake' },
        { title: 'Model', dataIndex: 'model', key: 'model' },
        { title: 'Location', dataIndex: 'machineLocation', key: 'machineLocation' },
        { title: 'Price', dataIndex: 'price', key: 'price', width: 100 },
      ]}
      getInitialValues={record => ({
        ...record,
        installationDate: record.installationDate
          ? dayjs(record.installationDate, DATE_FORMAT)
          : undefined,
        purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate, DATE_FORMAT) : undefined,
        warrantyExpiry: record.warrantyExpiry
          ? dayjs(record.warrantyExpiry, DATE_FORMAT)
          : undefined,
        amcExpiry: record.amcExpiry ? dayjs(record.amcExpiry, DATE_FORMAT) : undefined,
      })}
      renderFields={() => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FormField
            label="Machine Name"
            name="name"
            rules={[{ required: true, message: 'Machine name is required' }]}
          />
          <FormField label="Machine Make" name="machineMake" />
          <FormField label="Model" name="model" />
          <FormField label="Serial Number" name="serialNumber" />
          <FormField label="Capacity" name="capacity" placeholder="e.g. 50 Ton" />
          <FormField label="Power Rating" name="powerRating" placeholder="e.g. 15 kW" />
          <FormField label="Installation Date" name="installationDate" fieldType="date" />
          <FormField label="Purchase Date" name="purchaseDate" fieldType="date" />
          <FormField label="Warranty Expiry" name="warrantyExpiry" fieldType="date" />
          <FormField label="AMC Expiry" name="amcExpiry" fieldType="date" />
          <FormField label="Maintenance Interval" name="maintenanceInterval" />
          <FormField label="Machine Location" name="machineLocation" />
          <FormField label="Price" name="price" fieldType="number" />
        </div>
      )}
      onSubmit={async (values, editing) => {
        const asDate = (v: unknown) => (v ? (v as dayjs.Dayjs).format(DATE_FORMAT) : undefined)
        const payload = {
          name: values.name as string,
          machineMake: values.machineMake as string | undefined,
          model: values.model as string | undefined,
          serialNumber: values.serialNumber as string | undefined,
          capacity: values.capacity as string | undefined,
          powerRating: values.powerRating as string | undefined,
          installationDate: asDate(values.installationDate),
          purchaseDate: asDate(values.purchaseDate),
          warrantyExpiry: asDate(values.warrantyExpiry),
          amcExpiry: asDate(values.amcExpiry),
          maintenanceInterval: values.maintenanceInterval as string | undefined,
          machineLocation: values.machineLocation as string | undefined,
          price: values.price as number | undefined,
        }
        if (editing) {
          await updateMachine({ id: editing.id, payload })
        } else {
          await createMachine(payload)
        }
      }}
      onDelete={async record => {
        await deleteMachine(record.id)
      }}
    />
  )
}
