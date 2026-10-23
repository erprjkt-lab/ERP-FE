import { Menu, Tag } from 'antd'
import type { FC } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks/useIsMobile'
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

  // A fixed 220px rail beside the content leaves ~115px for the table on a
  // phone. Below md the rail becomes a horizontal scrolling strip above the
  // content instead — the same shape the Reports rail already uses.
  const isMobile = useIsMobile()

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 24,
        minWidth: 0,
      }}
    >
      <div
        className={isMobile ? 'erp-items-rail is-horizontal' : undefined}
        style={isMobile ? undefined : { width: 220, flexShrink: 0 }}
      >
        <Menu
          mode={isMobile ? 'horizontal' : 'inline'}
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
