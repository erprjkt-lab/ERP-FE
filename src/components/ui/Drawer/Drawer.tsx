import { Drawer as AntDrawer } from 'antd'
import type { DrawerProps as AntDrawerProps } from 'antd'
import type { FC } from 'react'

export interface DrawerProps extends AntDrawerProps {}

// Narrow viewports are handled by `.ant-drawer-content-wrapper { max-width: 100vw }`
// in index.css. A JS Math.min against window.innerWidth was read once at render
// and then went stale on every resize or rotation; CSS re-evaluates for free.
export const Drawer: FC<DrawerProps> = ({ width = 480, ...props }) => {
  return <AntDrawer width={width} destroyOnHidden {...props} />
}
