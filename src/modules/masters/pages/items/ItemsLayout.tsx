import { Menu, Tag } from 'antd'
import type { FC } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ITEM_CATEGORY_NAV } from './itemCategoryNav'

export const ItemsLayout: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const activeSegment = location.pathname.split('/').pop()

  const menuItems = ITEM_CATEGORY_NAV.map(entry => ({
    key: entry.path,
    label: entry.draftSchema ? (
      <span>
        {entry.label} <Tag style={{ marginInlineStart: 4 }}>Draft schema</Tag>
      </span>
    ) : (
      entry.label
    ),
  }))

  return (
    <div style={{ height: '100%', display: 'flex', gap: 24 }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <Menu
          mode="inline"
          selectedKeys={activeSegment ? [activeSegment] : []}
          items={menuItems}
          onClick={({ key }) => navigate(`/masters/items/${key}`)}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
        <Outlet />
      </div>
    </div>
  )
}
