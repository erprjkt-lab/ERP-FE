import {
  BankOutlined,
  DashboardOutlined,
  InboxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Menu, Typography } from 'antd'
import type { FC } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        trigger={null}
        width={220}
        style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            padding: sidebarCollapsed ? 0 : '0 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {sidebarCollapsed ? (
            <Typography.Text strong style={{ fontSize: 18 }}>E</Typography.Text>
          ) : (
            <Typography.Title level={4} style={{ margin: 0 }}>ERP App</Typography.Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/hr']}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', paddingTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} icon={<UserOutlined />} />
              <Typography.Text>Admin</Typography.Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
