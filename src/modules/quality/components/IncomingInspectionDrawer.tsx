import { Drawer } from 'antd'
import type { FC } from 'react'
import { IncomingInspectionReports } from './IncomingInspectionReports'

export interface IncomingInspectionDrawerProps {
  open: boolean
  grnItemId?: string
  itemId?: string
  itemName?: string
  grnNo?: string
  onClose: () => void
}

export const IncomingInspectionDrawer: FC<IncomingInspectionDrawerProps> = ({
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
