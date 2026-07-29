import dayjs from 'dayjs'
import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { GaugeInstrument } from '@/types/masters'
import {
  useCreateGaugeInstrument,
  useDeleteGaugeInstrument,
  useGaugeInstruments,
  useUpdateGaugeInstrument,
} from '../../hooks/useGaugeInstruments'

const DATE_FORMAT = 'YYYY-MM-DD'

export const GaugeInstrumentList: FC = () => {
  const { data: gaugeInstruments = [], isLoading } = useGaugeInstruments()
  const { mutateAsync: createGaugeInstrument } = useCreateGaugeInstrument()
  const { mutateAsync: updateGaugeInstrument } = useUpdateGaugeInstrument()
  const { mutateAsync: deleteGaugeInstrument } = useDeleteGaugeInstrument()

  return (
    <SimpleMasterList<GaugeInstrument>
      title="Gauge & Instrument"
      breadcrumbParent={{ label: 'Items', href: '/masters/items' }}
      breadcrumbLabel="Gauge & Instrument"
      totalLabel="gauges & instruments"
      addButtonLabel="Add Gauge / Instrument"
      modalWidth={720}
      data={gaugeInstruments}
      loading={isLoading}
      columns={[
        { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Gauge Type', dataIndex: 'gaugeType', key: 'gaugeType' },
        { title: 'Manufacturer', dataIndex: 'manufacturer', key: 'manufacturer' },
        { title: 'Calibration Due', dataIndex: 'calibrationDueDate', key: 'calibrationDueDate' },
        { title: 'Price', dataIndex: 'price', key: 'price', width: 100 },
      ]}
      getInitialValues={record => ({
        ...record,
        calibrationDueDate: record.calibrationDueDate
          ? dayjs(record.calibrationDueDate, DATE_FORMAT)
          : undefined,
      })}
      renderFields={() => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FormField
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Name is required' }]}
          />
          <FormField label="Gauge Type" name="gaugeType" />
          <FormField label="Instrument Range" name="instrumentRange" placeholder="e.g. 0-25mm" />
          <FormField label="Accuracy" name="accuracy" placeholder="e.g. ±0.01mm" />
          <FormField label="Least Count" name="leastCount" placeholder="e.g. 0.01mm" />
          <FormField label="Calibration Frequency" name="calibrationFrequency" />
          <FormField label="Calibration Due Date" name="calibrationDueDate" fieldType="date" />
          <FormField label="Certificate Number" name="certificateNumber" />
          <FormField label="Manufacturer" name="manufacturer" />
          <FormField label="Category" name="category" />
          <FormField label="Price" name="price" fieldType="number" />
        </div>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          name: values.name as string,
          gaugeType: values.gaugeType as string | undefined,
          instrumentRange: values.instrumentRange as string | undefined,
          accuracy: values.accuracy as string | undefined,
          leastCount: values.leastCount as string | undefined,
          calibrationFrequency: values.calibrationFrequency as string | undefined,
          calibrationDueDate: values.calibrationDueDate
            ? (values.calibrationDueDate as dayjs.Dayjs).format(DATE_FORMAT)
            : undefined,
          certificateNumber: values.certificateNumber as string | undefined,
          manufacturer: values.manufacturer as string | undefined,
          category: values.category as string | undefined,
          price: values.price as number | undefined,
        }
        if (editing) {
          await updateGaugeInstrument({ id: editing.id, payload })
        } else {
          await createGaugeInstrument(payload)
        }
      }}
      onDelete={async record => {
        await deleteGaugeInstrument(record.id)
      }}
    />
  )
}
