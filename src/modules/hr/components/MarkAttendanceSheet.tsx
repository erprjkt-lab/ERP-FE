import { App, Card, DatePicker, Radio, Select, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { ApiAttendanceStatus } from '@/types/api/hr'
import type { Employee } from '@/types/hr'
import { ATTENDANCE_STATUSES } from '../constants'
import { useAttendanceForDate, useSaveAttendance } from '../hooks/useAttendance'
import { useDepartments } from '../hooks/useDepartments'
import { useEmployees } from '../hooks/useEmployees'

export interface MarkAttendanceSheetProps {
  /** False while the user may read attendance but not record it. */
  canWrite: boolean
}

export const MarkAttendanceSheet: FC<MarkAttendanceSheetProps> = ({ canWrite }) => {
  const { message } = App.useApp()
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [departmentId, setDepartmentId] = useState<string>()
  // Only what the user changed on this sheet; everything else reads through to
  // what the day already holds, so no effect has to copy the server's rows into
  // state when a refetch lands.
  const [edits, setEdits] = useState<Record<string, ApiAttendanceStatus>>({})

  const { data: departments = [] } = useDepartments()
  const { data: employees = [], isLoading: employeesLoading } = useEmployees()
  const { data: saved, isLoading: savedLoading } = useAttendanceForDate(
    date.format('YYYY-MM-DD'),
    departmentId ? Number(departmentId) : undefined,
  )
  const { mutateAsync: save, isPending } = useSaveAttendance()

  // The day's existing marks — the bulk endpoint upserts, so saving again
  // corrects the day rather than duplicating it.
  const savedStatus = useMemo(
    () => new Map(saved.map(mark => [mark.employeeId, mark.status])),
    [saved],
  )
  const statusFor = (employeeId: string) => edits[employeeId] ?? savedStatus.get(employeeId)

  // Switching day or department makes the pending edits meaningless — they were
  // for a different set of rows. Adjusted during render rather than in an effect,
  // which is React's own pattern for resetting state when a key changes.
  const sheetKey = `${date.format('YYYY-MM-DD')}:${departmentId ?? ''}`
  const [trackedKey, setTrackedKey] = useState(sheetKey)
  if (sheetKey !== trackedKey) {
    setTrackedKey(sheetKey)
    setEdits({})
  }

  const rows = employees.filter(
    employee =>
      employee.status === 'active' && (!departmentId || employee.departmentId === departmentId),
  )
  const markedCount = rows.filter(employee => statusFor(employee.id)).length

  const handleSave = async () => {
    const entries = rows
      .map(employee => ({ employee_id: Number(employee.id), status: statusFor(employee.id) }))
      .filter((entry): entry is { employee_id: number; status: ApiAttendanceStatus } =>
        Boolean(entry.status),
      )

    if (entries.length === 0) {
      message.error('Mark at least one employee before saving')
      return
    }

    try {
      await save({ attendance_date: date.format('YYYY-MM-DD'), entries })
      // The refetch is now the source of truth for every row that was just sent.
      setEdits({})
      message.success(`Attendance saved for ${entries.length} employee(s)`)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<Employee> = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, employee) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{employee.fullName}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{employee.department?.name ?? '—'}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 280,
      align: 'right',
      render: (_, employee) => (
        <Radio.Group
          size="small"
          optionType="button"
          disabled={!canWrite}
          value={statusFor(employee.id)}
          onChange={event =>
            setEdits(prev => ({
              ...prev,
              [employee.id]: event.target.value as ApiAttendanceStatus,
            }))
          }
          options={ATTENDANCE_STATUSES.map(status => ({
            label: status.code,
            value: status.value,
            title: status.label,
          }))}
        />
      ),
    },
  ]

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <DatePicker
          value={date}
          onChange={value => value && setDate(value)}
          allowClear={false}
          format="DD MMM YYYY"
          // Attendance is recorded for a day that has happened.
          maxDate={dayjs()}
          style={{ width: 170 }}
        />
        <Select
          placeholder="All departments"
          value={departmentId}
          onChange={setDepartmentId}
          options={departments.map(department => ({
            label: department.name,
            value: department.id,
          }))}
          allowClear
          style={{ minWidth: 180 }}
        />
        {canWrite && (
          <>
            <Button
              onClick={() =>
                setEdits(prev => ({
                  ...prev,
                  ...Object.fromEntries(rows.map(employee => [employee.id, 1 as const])),
                }))
              }
            >
              Mark all present
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={isPending}
              style={{ marginLeft: 'auto' }}
            >
              Save attendance
            </Button>
          </>
        )}
      </div>

      <DataTable<Employee>
        columns={columns}
        dataSource={rows}
        rowKey="id"
        loading={employeesLoading || savedLoading}
        pagination={false}
        size="small"
        totalLabel="employees"
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
          marginTop: 12,
        }}
      >
        <Typography.Text strong style={{ fontSize: 12 }}>
          {markedCount} of {rows.length} marked
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Tap a status to set it per employee — anyone left unmarked is not sent, and saving the
          same day again corrects it.
        </Typography.Text>
      </div>
    </Card>
  )
}
