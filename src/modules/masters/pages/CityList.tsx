import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { City } from '@/types/masters'
import { useCities, useCreateCity, useDeleteCity, useUpdateCity } from '../hooks/useCities'
import { useStates } from '../hooks/useStates'

export const CityList: FC = () => {
  const { data: cities = [], isLoading } = useCities()
  const { data: states = [] } = useStates()
  const { mutateAsync: createCity } = useCreateCity()
  const { mutateAsync: updateCity } = useUpdateCity()
  const { mutateAsync: deleteCity } = useDeleteCity()

  const stateOptions = states.map(s => ({ label: s.name, value: s.id }))

  return (
    <SimpleMasterList<City>
      title="Cities"
      breadcrumbParent={{ label: 'Masters', href: '/masters' }}
      breadcrumbLabel="City"
      totalLabel="cities"
      addButtonLabel="Add City"
      data={cities}
      loading={isLoading}
      columns={[
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'State', dataIndex: ['state', 'name'], key: 'state' },
      ]}
      getInitialValues={record => ({ name: record.name, stateId: record.stateId })}
      renderFields={() => (
        <>
          <FormField
            label="City Name"
            name="name"
            rules={[{ required: true, message: 'City name is required' }]}
          />
          <FormField
            label="State"
            name="stateId"
            fieldType="select"
            options={stateOptions}
            rules={[{ required: true, message: 'State is required' }]}
          />
        </>
      )}
      onSubmit={async (values, editing) => {
        const name = values.name as string
        const stateId = (values.stateId as string | undefined) ?? null
        if (editing) {
          await updateCity({ id: editing.id, payload: { name, stateId } })
        } else {
          await createCity({ name, stateId })
        }
      }}
      onDelete={async record => {
        await deleteCity(record.id)
      }}
    />
  )
}
