import { Drawer } from 'antd'
import type { FC } from 'react'
import { IncomingInspectionReports } from './IncomingInspectionReports'
import { deferMount } from '@/components/ui/deferMount'

export interface IncomingInspectionDrawerProps {
  open: boolean
  grnItemId?: string
  itemId?: string
  itemName?: string
  grnNo?: string
  onClose: () => void
}

const IncomingInspectionDrawerInner: FC<IncomingInspectionDrawerProps> = ({
  open,
  grnItemId,
  itemId,
  itemName,
  grnNo,
  onClose,
}) => {
  return (
    <Drawer
      title={`Incoming Inspection (IIR) — ${itemName ?? 'Item'}${grnNo ? ` (${grnNo})` : ''}`}
      open={open}
      onClose={onClose}
      width={900}
      destroyOnClose
    >
      {grnItemId && itemId ? (
        <IncomingInspectionReports grnItemId={grnItemId} itemId={itemId} />
      ) : null}
    </Drawer>
  )
}

export const IncomingInspectionDrawer = deferMount(IncomingInspectionDrawerInner)
