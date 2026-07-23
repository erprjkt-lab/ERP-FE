import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { Country } from '@/types/masters'
import {
  useCountries,
  useCreateCountry,
  useDeleteCountry,
  useUpdateCountry,
} from '../hooks/useCountries'

export const CountryList: FC = () => {
  const { data: countries = [], isLoading } = useCountries()
  const { mutateAsync: createCountry } = useCreateCountry()
  const { mutateAsync: updateCountry } = useUpdateCountry()
  const { mutateAsync: deleteCountry } = useDeleteCountry()

  return (
    <SimpleMasterList<Country>
      title="Countries"
      breadcrumbParent={{ label: 'Masters', href: '/masters' }}
      breadcrumbLabel="Country"
      totalLabel="countries"
      addButtonLabel="Add Country"
      data={countries}
      loading={isLoading}
      columns={[{ title: 'Name', dataIndex: 'name', key: 'name' }]}
      renderFields={() => (
        <FormField
          label="Country Name"
          name="name"
          rules={[{ required: true, message: 'Country name is required' }]}
        />
      )}
      onSubmit={async (values, editing) => {
        const name = values.name as string
        if (editing) {
          await updateCountry({ id: editing.id, payload: { name } })
        } else {
          await createCountry({ name })
        }
      }}
      onDelete={async record => {
        await deleteCountry(record.id)
      }}
    />
  )
}
