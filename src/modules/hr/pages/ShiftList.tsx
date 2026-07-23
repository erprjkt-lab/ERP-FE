import dayjs from 'dayjs'
import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { Shift } from '@/types/hr'
import { useCreateShift, useDeleteShift, useShifts, useUpdateShift } from '../hooks/useShifts'

const TIME_FORMAT = 'HH:mm'

export const ShiftList: FC = () => {
  const { data: shifts = [], isLoading } = useShifts()
  const { mutateAsync: createShift } = useCreateShift()
  const { mutateAsync: updateShift } = useUpdateShift()
  const { mutateAsync: deleteShift } = useDeleteShift()

  return (
    <SimpleMasterList<Shift>
      title="Shifts"
      breadcrumbParent={{ label: 'HR', href: '/hr' }}
      breadcrumbLabel="Shift"
      totalLabel="shifts"
      addButtonLabel="Add Shift"
      data={shifts}
      loading={isLoading}
      columns={[
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Start', dataIndex: 'startTime', key: 'startTime' },
        { title: 'End', dataIndex: 'endTime', key: 'endTime' },
        { title: 'Lunch Start', dataIndex: 'lunchStartTime', key: 'lunchStartTime' },
        { title: 'Lunch End', dataIndex: 'lunchEndTime', key: 'lunchEndTime' },
      ]}
      getInitialValues={record => ({
        name: record.name,
        startTime: dayjs(record.startTime, TIME_FORMAT),
        endTime: dayjs(record.endTime, TIME_FORMAT),
        lunchStartTime: dayjs(record.lunchStartTime, TIME_FORMAT),
        lunchEndTime: dayjs(record.lunchEndTime, TIME_FORMAT),
      })}
      renderFields={() => (
        <>
          <FormField label="Shift Name" name="name" rules={[{ required: true }]} />
          <FormField
            label="Start Time"
            name="startTime"
            fieldType="time"
            rules={[{ required: true }]}
          />
          <FormField
            label="End Time"
            name="endTime"
            fieldType="time"
            rules={[{ required: true }]}
          />
          <FormField
            label="Lunch Start"
            name="lunchStartTime"
            fieldType="time"
            rules={[{ required: true }]}
          />
          <FormField
            label="Lunch End"
            name="lunchEndTime"
            fieldType="time"
            rules={[{ required: true }]}
          />
        </>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          shift_name: values.name as string,
          shift_start: (values.startTime as dayjs.Dayjs).format(TIME_FORMAT),
          shift_end: (values.endTime as dayjs.Dayjs).format(TIME_FORMAT),
          lunch_start: (values.lunchStartTime as dayjs.Dayjs).format(TIME_FORMAT),
          lunch_end: (values.lunchEndTime as dayjs.Dayjs).format(TIME_FORMAT),
        }
        if (editing) {
          await updateShift({ id: Number(editing.id), payload })
        } else {
          await createShift(payload)
        }
      }}
      onDelete={async record => {
        await deleteShift(Number(record.id))
      }}
    />
  )
}
