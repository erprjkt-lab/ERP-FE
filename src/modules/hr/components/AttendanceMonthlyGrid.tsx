import { DownloadOutlined } from '@ant-design/icons'
import { Card, DatePicker, Select, Space, Tooltip, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { ApiMonthlyAttendanceRow } from '@/types/api/hr'
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_BY_CODE } from '../constants'
import { useMonthlyAttendance } from '../hooks/useAttendance'
import { useDepartments } from '../hooks/useDepartments'
import { useEmployees } from '../hooks/useEmployees'

/** One day cell: the status letter in its colour, or the dotted placeholder that
 *  says nobody marked this employee that day (ERP-BE sends '' for those — there
 *  is no holiday or weekly-off fill yet, so a Sunday reads as unmarked too). */
const DayCell: FC<{ code: string }> = ({ code }) => {
  const status = ATTENDANCE_STATUS_BY_CODE[code]

  if (!status) {
    return (
      <span
        aria-label="Not marked"
        style={{
          display: 'inline-block',
          width: 20,
          height: 20,
          border: '1px dashed #CBD5E1',
          borderRadius: 4,
        }}
      />
    )
  }

  return (
    <Tooltip title={status.label}>
      <span style={{ color: status.color, fontWeight: 600, fontSize: 12 }}>{status.code}</span>
    </Tooltip>
  )
}

function toCsv(
  rows: ApiMonthlyAttendanceRow[],
  daysInMonth: number,
  nameFor: (row: ApiMonthlyAttendanceRow) => string,
): string {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const header = ['Employee', ...days, 'Present', 'Absent', 'Half Day', 'Leave', 'Not Marked']
  const body = rows.map(row => [
    `"${nameFor(row).replace(/"/g, '""')}"`,
    ...days.map(day => row.days[String(day)] ?? ''),
    row.summary.present,
    row.summary.absent,
    row.summary.half_day,
    row.summary.leave,
    row.summary.not_marked,
  ])
  return [header, ...body].map(line => line.join(',')).join('\n')
}

export const AttendanceMonthlyGrid: FC = () => {
  const [month, setMonth] = useState<Dayjs>(dayjs())
  const [departmentId, setDepartmentId] = useState<string>()
  const [employeeId, setEmployeeId] = useState<string>()

  const { data: departments = [] } = useDepartments()
  const { data: employees = [] } = useEmployees()
  const { data: report, isLoading } = useMonthlyAttendance({
    month: month.month() + 1,
    year: month.year(),
    ...(departmentId ? { department_id: Number(departmentId) } : {}),
    ...(employeeId ? { employee_id: Number(employeeId) } : {}),
  })

  // The report sends `employee_name`, which is nullable on ERP-BE and empty for
  // plenty of real rows — the employee list is the one place that already falls
  // back to the login name, and it carries the department too, so both the name
  // and the line under it are read from there.
  const employeeById = useMemo(
    () => new Map(employees.map(employee => [employee.id, employee])),
    [employees],
  )

  const daysInMonth = report?.days_in_month ?? month.daysInMonth()
  const rows = report?.employees ?? []

  const nameFor = (row: ApiMonthlyAttendanceRow) =>
    employeeById.get(String(row.employee_id))?.fullName ||
    row.employee_name ||
    `Employee #${row.employee_id}`

  const handleExport = () => {
    const blob = new Blob([toCsv(rows, daysInMonth, nameFor)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance-${month.format('YYYY-MM')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const columns: TableColumnsType<ApiMonthlyAttendanceRow> = [
    {
      title: 'Employee',
      key: 'employee',
      width: 190,
      fixed: 'left',
      render: (_, row) => {
        const employee = employeeById.get(String(row.employee_id))
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{nameFor(row)}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {employee?.department?.name ?? '—'}
            </div>
          </div>
        )
      },
    },
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
      const isSunday = month.date(day).day() === 0
      return {
        title: <span style={{ color: isSunday ? '#DC2626' : undefined }}>{day}</span>,
        key: `day-${day}`,
        width: 38,
        align: 'center' as const,
        render: (_: unknown, row: ApiMonthlyAttendanceRow) => (
          <DayCell code={row.days[String(day)] ?? ''} />
        ),
      }
    }),
    {
      title: 'P / A / HD / L',
      key: 'summary',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, row) => (
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {row.summary.present} / {row.summary.absent} / {row.summary.half_day} /{' '}
          {row.summary.leave}
        </span>
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
          alignItems: 'flex-end',
          marginBottom: 16,
        }}
      >
        <DatePicker
          picker="month"
          value={month}
          onChange={value => value && setMonth(value)}
          allowClear={false}
          format="MMMM YYYY"
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
        <Select
          placeholder="All employees"
          value={employeeId}
          onChange={setEmployeeId}
          options={employees.map(employee => ({ label: employee.fullName, value: employee.id }))}
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ minWidth: 200 }}
        />
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={rows.length === 0}>
          Export
        </Button>

        <Space size={14} wrap style={{ marginLeft: 'auto' }}>
          {ATTENDANCE_STATUSES.map(status => (
            <Space size={4} key={status.code}>
              <span style={{ color: status.color, fontWeight: 700, fontSize: 12 }}>
                {status.code}
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {status.label}
              </Typography.Text>
            </Space>
          ))}
          <Space size={4}>
            <DayCell code="" />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Not marked
            </Typography.Text>
          </Space>
        </Space>
      </div>

      <DataTable<ApiMonthlyAttendanceRow>
        columns={columns}
        dataSource={rows}
        rowKey="employee_id"
        loading={isLoading}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        totalLabel="employees"
        // 31 day columns do not survive being folded into a mobile card.
        disableMobileCards
      />
    </Card>
  )
}
