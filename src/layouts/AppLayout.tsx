import { DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons'
import { App, Avatar, Button, Dropdown, Layout, Menu, Typography, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLogout } from '@/hooks/useAuth'
import { DASHBOARD_ITEM, NAV_GROUPS, getActiveNav } from '@/layouts/navConfig'
import { useAppStore } from '@/store'
import { BRAND_GRADIENT_FROM, BRAND_GRADIENT_TO } from '@/theme/brand'
import { SIDEBAR_BG, SIDEBAR_BORDER } from '@/theme/sidebar'
import { FONT_DISPLAY } from '@/theme/typography'

const { Header, Sider, Content } = Layout

const NAV_ITEMS = [
  DASHBOARD_ITEM,
  ...NAV_GROUPS.map(group => ({
    key: group.key,
    icon: group.icon,
    label: group.label,
    children: group.children.map(leaf => ({ key: leaf.path, label: leaf.label })),
  })),
]

export const AppLayout: FC = () => {
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = antTheme.useToken()
  const { message } = App.useApp()
  const { mutate: submitLogout } = useLogout()

  const activeNav = getActiveNav(location.pathname)
  const isDashboard = location.pathname === '/'
  const selectedKeys = activeNav ? [activeNav.leafKey] : isDashboard ? ['/'] : []

  const [openKeys, setOpenKeys] = useState<string[]>(activeNav ? [activeNav.groupKey] : ['/hr'])
  // Force the active route's group open only when navigation actually moves
  // into a different group — tracked here so we can still let the user
  // freely collapse it afterward without it snapping back open every render.
  // Accordion behavior: only one group open at a time, so this replaces
  // openKeys rather than appending to it.
  const [lastActiveGroupKey, setLastActiveGroupKey] = useState(activeNav?.groupKey)
  if (activeNav && activeNav.groupKey !== lastActiveGroupKey) {
    setLastActiveGroupKey(activeNav.groupKey)
    setOpenKeys([activeNav.groupKey])
  }

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      submitLogout(undefined, {
        onSettled: () => {
          message.success('Signed out successfully')
          navigate('/login', { replace: true })
        },
      })
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        trigger={null}
        width={220}
        breakpoint="md"
        onBreakpoint={broken => setSidebarCollapsed(broken)}
        className="app-sidebar-scroll"
        style={{
          background: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BORDER}`,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? 0 : '0 24px',
            borderBottom: `1px solid ${SIDEBAR_BORDER}`,
            position: 'sticky',
            top: 0,
            background: SIDEBAR_BG,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${BRAND_GRADIENT_FROM}, ${BRAND_GRADIENT_TO})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography.Text strong style={{ fontSize: 16, color: '#fff' }}>
              E
            </Typography.Text>
          </div>
          {!sidebarCollapsed && (
            <Typography.Title
              level={4}
              style={{ margin: '0 0 0 12px', color: '#fff', fontFamily: FONT_DISPLAY }}
            >
              ERP App
            </Typography.Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={keys => {
            const nextKeys = keys as string[]
            // Accordion behavior: keep only the most recently opened group,
            // so expanding one collapses whichever other was open.
            setOpenKeys(nextKeys.length > 1 ? [nextKeys[nextKeys.length - 1]] : nextKeys)
          }}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          className="app-sidebar-menu"
          style={{ border: 'none', paddingTop: 8, background: 'transparent' }}
        />
      </Sider>

      <Layout style={{ height: '100vh' }}>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 64,
            flexShrink: 0,
          }}
        >
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
          />
          <Dropdown
            menu={{
              items: [
                { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
                { type: 'divider' },
                { key: 'logout', label: 'Logout', danger: true },
              ],
              onClick: handleUserMenuClick,
            }}
          >
            <Button
              type="text"
              style={{
                height: 40,
                paddingInline: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Avatar size={28} icon={<UserOutlined />} />
              <Typography.Text style={{ fontWeight: 500 }}>Admin</Typography.Text>
              <DownOutlined style={{ fontSize: 10, color: token.colorTextTertiary }} />
            </Button>
          </Dropdown>
        </Header>

        <Content
          style={{ padding: 24, background: token.colorBgLayout, overflow: 'auto', flex: 1 }}
        >
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
