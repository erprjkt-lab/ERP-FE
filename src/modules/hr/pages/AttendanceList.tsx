import { Alert, Segmented } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePagePermission } from '@/hooks/usePagePermission'
import { AttendanceMonthlyGrid } from '../components/AttendanceMonthlyGrid'
import { MarkAttendanceSheet } from '../components/MarkAttendanceSheet'

/** Two halves of the same module: the month-wide roll-up people read, and the
 *  single-day sheet they write. One route, because the floor moves between them
 *  constantly and they share every filter the user has in their head. */
export const AttendanceList: FC = () => {
  const { canWrite, moduleKey, isLoaded } = usePagePermission()
  const [view, setView] = useState<'report' | 'mark'>('mark')

  // Without this the sheet just renders every status button greyed out, which
  // reads as a broken screen rather than a missing grant. `moduleKey` is unset
  // when the sidebar carried no `attendance` node at all — on this backend that
  // means rbac:sync-modules hasn't run since the module was added.
  const permissionNotice = !isLoaded
    ? undefined
    : !moduleKey
      ? 'Attendance is not in your menu, so nothing here can be edited. The attendance module needs to be synced and granted on the backend.'
      : !canWrite
        ? 'You can view attendance but not record it — your role is missing the write permission for this module.'
        : undefined

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark the day's attendance and review the monthly roll-up"
        breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Attendance' }]}
        actions={
          <Segmented
            value={view}
            onChange={value => setView(value as 'report' | 'mark')}
            options={[
              { label: 'Mark Attendance', value: 'mark' },
              { label: 'Monthly Report', value: 'report' },
            ]}
          />
        }
      />

      {permissionNotice && view === 'mark' && (
        <Alert type="warning" showIcon message={permissionNotice} style={{ marginBottom: 12 }} />
      )}

      {view === 'mark' ? <MarkAttendanceSheet canWrite={canWrite} /> : <AttendanceMonthlyGrid />}
    </div>
  )
}
