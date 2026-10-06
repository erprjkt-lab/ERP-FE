import { Drawer } from 'antd'
import type { FC } from 'react'
import type { InspectionReportType } from '@/types/quality'
import { JobCardInspectionReports } from './JobCardInspectionReports'

export interface JobCardInspectionDrawerProps {
  open: boolean
  jobCardId?: string
  jobCardNumber?: string
  itemId?: string
  routes?: { processId: string; processName: string }[]
  reportType: InspectionReportType
  onClose: () => void
}

export const JobCardInspectionDrawer: FC<JobCardInspectionDrawerProps> = ({
  open,
  jobCardId,
  jobCardNumber,
  itemId,
  routes = [],
  reportType,
  onClose,
}) => {
  return (
    <Drawer
      title={`${reportType} — ${jobCardNumber ?? 'Job Card'}`}
      open={open}
      onClose={onClose}
      width={900}
      destroyOnClose
    >
      {jobCardId && itemId ? (
        <JobCardInspectionReports
          jobCardId={jobCardId}
          itemId={itemId}
          routeProcesses={routes.map(r => ({ id: r.processId, name: r.processName }))}
          reportType={reportType}
        />
      ) : null}
    </Drawer>
  )
}
