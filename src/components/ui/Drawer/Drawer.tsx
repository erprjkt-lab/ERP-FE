import { Drawer as AntDrawer } from 'antd'
import type { DrawerProps as AntDrawerProps } from 'antd'
import type { FC } from 'react'

export interface DrawerProps extends AntDrawerProps {}

export const Drawer: FC<DrawerProps> = ({ width = 480, ...props }) => {
  return <AntDrawer width={width} destroyOnClose {...props} />
}
