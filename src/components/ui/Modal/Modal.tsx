import { Modal as AntModal } from 'antd'
import type { ModalProps as AntModalProps } from 'antd'
import type { FC } from 'react'

export interface ModalProps extends AntModalProps {}

export const Modal: FC<ModalProps> = props => {
  return <AntModal destroyOnHidden {...props} />
}
