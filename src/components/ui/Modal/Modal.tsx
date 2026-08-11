import { Modal as AntModal } from 'antd'
import type { ModalProps as AntModalProps } from 'antd'
import type { FC } from 'react'

export interface ModalProps extends Omit<AntModalProps, 'styles'> {
  styles?: Exclude<AntModalProps['styles'], (...args: never[]) => unknown>
}

// Fixed, centered modal with the scroll contained to the body — without this,
// a modal taller than the viewport (long forms like Add Machine) pushes the
// page itself into scroll instead of scrolling inside the dialog.
export const Modal: FC<ModalProps> = ({ centered = true, styles, ...props }) => {
  return (
    <AntModal
      destroyOnHidden
      centered={centered}
      styles={{
        ...styles,
        body: {
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          ...styles?.body,
        },
      }}
      {...props}
    />
  )
}
