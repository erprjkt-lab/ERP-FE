import {
  BankOutlined,
  DashboardOutlined,
  InboxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Menu, Typography, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { BRAND_GRADIENT_FROM, BRAND_GRADIENT_TO } from '@/theme/brand'
import { SIDEBAR_BG, SIDEBAR_BORDER } from '@/theme/sidebar'

const { Header, Sider, Content } = Layout

const NAV_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: '/hr',
    icon: <TeamOutlined />,
    label: 'HR & Payroll',
    children: [
      { key: '/hr/employees', label: 'Employees' },
      { key: '/hr/leave', label: 'Leave Management' },
      { key: '/hr/payroll', label: 'Payroll' },
    ],
  },
  { key: '/finance', icon: <BankOutlined />, label: 'Finance' },
  { key: '/inventory', icon: <InboxOutlined />, label: 'Inventory' },
]

export const AppLayout: FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = antTheme.useToken()

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        trigger={null}
        width={220}
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
            <Typography.Title level={4} style={{ margin: '0 0 0 12px', color: '#fff' }}>
              ERP App
            </Typography.Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/hr']}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
                  { type: 'divider' },
                  { key: 'logout', label: 'Logout', danger: true },
                ],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={32} icon={<UserOutlined />} />
                <Typography.Text>Admin</Typography.Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{ padding: 24, background: token.colorBgLayout, overflow: 'auto', flex: 1 }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
