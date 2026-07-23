import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { State } from '@/types/masters'
import { useCountries } from '../hooks/useCountries'
import { useCreateState, useDeleteState, useStates, useUpdateState } from '../hooks/useStates'

export const StateList: FC = () => {
  const { data: states = [], isLoading } = useStates()
  const { data: countries = [] } = useCountries()
  const { mutateAsync: createState } = useCreateState()
  const { mutateAsync: updateState } = useUpdateState()
  const { mutateAsync: deleteState } = useDeleteState()

  const countryOptions = countries.map(c => ({ label: c.name, value: c.id }))

  return (
    <SimpleMasterList<State>
      title="States"
      breadcrumbParent={{ label: 'Masters', href: '/masters' }}
      breadcrumbLabel="State"
      totalLabel="states"
      addButtonLabel="Add State"
      data={states}
      loading={isLoading}
      columns={[
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Country', dataIndex: ['country', 'name'], key: 'country' },
      ]}
      getInitialValues={record => ({ name: record.name, countryId: record.countryId })}
      renderFields={() => (
        <>
          <FormField
            label="State Name"
            name="name"
            rules={[{ required: true, message: 'State name is required' }]}
          />
          <FormField
            label="Country"
            name="countryId"
            fieldType="select"
            options={countryOptions}
            rules={[{ required: true, message: 'Country is required' }]}
          />
        </>
      )}
      onSubmit={async (values, editing) => {
        const name = values.name as string
        const countryId = (values.countryId as string | undefined) ?? null
        if (editing) {
          await updateState({ id: editing.id, payload: { name, countryId } })
        } else {
          await createState({ name, countryId })
        }
      }}
      onDelete={async record => {
        await deleteState(record.id)
      }}
    />
  )
}
