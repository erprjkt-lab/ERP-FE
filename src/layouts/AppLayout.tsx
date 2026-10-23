import {
  CloseOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Typography,
  theme as antTheme,
} from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLogout } from '@/hooks/useAuth'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSidebarMenu } from '@/hooks/useMenus'
import { DASHBOARD_ITEM } from '@/layouts/navConfig'
import { buildSidebarItems, findActiveKeys, getKeyPath } from '@/layouts/sidebarNav'
import { useAppStore } from '@/store'
import { useAuthStore } from '@/store/authStore'
import { SIDEBAR_BG, SIDEBAR_BORDER } from '@/theme/sidebar'
import { FONT_DISPLAY } from '@/theme/typography'
import brandMark from '@/assets/brand/02.png'

const { Header, Sider, Content } = Layout

// Shared by the top bar and the sidebar logo block so their bottom borders line up.
const HEADER_HEIGHT = 48

export const AppLayout: FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const userName = useAuthStore(state => state.user?.name) ?? 'Admin'
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = antTheme.useToken()
  const { message } = App.useApp()
  const { mutate: submitLogout } = useLogout()

  const isMobile = useIsMobile()

  // The mobile off-canvas nav owns its own state. It deliberately does NOT reuse
  // `sidebarCollapsed`: that one means "desktop sidebar is the icon rail", and
  // overloading it both opened the drawer on every mobile load and wiped the
  // user's desktop sidebar preference whenever the viewport crossed 768px.
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const closeMobileNav = () => setMobileNavOpen(false)

  // The sidebar is the BE's permission-filtered menu tree (GET /menus/sidebar) — its
  // names and nesting — with each module pointed at this app's page for it. Until it
  // loads (or if it fails) only the dashboard shows.
  const { data: sidebarTree } = useSidebarMenu()
  const sidebarItems = buildSidebarItems(sidebarTree ?? [])
  // The BE tree carries its own Dashboard module (mapped to '/'), so the hardcoded
  // entry is only a fallback for before the menu loads — otherwise it duplicates.
  const navItems = sidebarItems.some(item => item.key === '/')
    ? sidebarItems
    : [DASHBOARD_ITEM, ...sidebarItems]

  const { selectedKey, openKeys: activeOpenKeys } = findActiveKeys(sidebarItems, location.pathname)
  const isDashboard = location.pathname === '/'
  const selectedKeys = selectedKey ? [selectedKey] : isDashboard ? ['/'] : []

  const [openKeys, setOpenKeys] = useState<string[]>(activeOpenKeys)
  // Force the active route's branch open only when navigation actually moves into a
  // different one — tracked here so the user can still collapse it afterward without
  // it snapping back open every render. Accordion behavior: one branch at a time, so
  // this replaces openKeys rather than appending to it.
  const activeBranchKey = activeOpenKeys.join('>')
  const [lastActiveBranchKey, setLastActiveBranchKey] = useState(activeBranchKey)
  if (activeBranchKey && activeBranchKey !== lastActiveBranchKey) {
    setLastActiveBranchKey(activeBranchKey)
    setOpenKeys(activeOpenKeys)
  }

  const handleOpenChange = (keys: unknown) => {
    const nextKeys = keys as string[]
    // Accordion behavior: keep only the branch that was just opened (the key
    // plus its ancestors), so expanding one collapses whichever other was open.
    const opened = nextKeys.find(key => !openKeys.includes(key))
    setOpenKeys(opened ? getKeyPath(sidebarItems, opened) : nextKeys)
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

  // Common navigation menu component
  const menuContent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      items={navItems}
      onClick={({ key }) => {
        navigate(key)
        if (isMobile) {
          closeMobileNav()
        }
      }}
      className="app-sidebar-menu"
      style={{ border: 'none', paddingTop: 8, background: 'transparent' }}
    />
  )

  return (
    <Layout style={{ height: '100dvh', width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* Mobile Off-Canvas Drawer Navigation: Takes 0px space on mobile when closed */}
      {isMobile ? (
        <Drawer
          placement="left"
          open={mobileNavOpen}
          onClose={closeMobileNav}
          styles={{
            body: {
              padding: 0,
              background: SIDEBAR_BG,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
            header: { display: 'none' },
            // 82% of the viewport but never wider than 280px. Done in CSS rather
            // than Math.min(window.innerWidth * 0.82, 280) so it stays correct
            // when the viewport changes instead of freezing at mount width.
            wrapper: { maxWidth: 280 },
          }}
          width="82%"
          destroyOnHidden
        >
          {/* Mobile Drawer Header */}
          <div
            style={{
              height: HEADER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              borderBottom: `1px solid ${SIDEBAR_BORDER}`,
              background: SIDEBAR_BG,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: 8,
                  background: 'rgba(0, 160, 227, 0.08)',
                  border: '1px solid rgba(0, 160, 227, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <img
                  src={brandMark}
                  alt="CoreFlow Tech"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Typography.Text
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: FONT_DISPLAY,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  CoreFlow <span style={{ color: '#00A0E3' }}>Tech</span>
                </Typography.Text>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.45)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Enterprise ERP
                </span>
              </div>
            </div>
            <Button
              type="text"
              icon={<CloseOutlined style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16 }} />}
              onClick={closeMobileNav}
              aria-label="Close navigation"
            />
          </div>

          <div
            style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}
            className="app-sidebar-scroll"
          >
            {menuContent}
          </div>
        </Drawer>
      ) : (
        /* Desktop Sider Navigation */
        <Sider
          collapsible
          collapsed={sidebarCollapsed}
          trigger={null}
          width={220}
          collapsedWidth={64}
          className="app-sidebar-scroll"
          style={{
            background: SIDEBAR_BG,
            borderRight: `1px solid ${SIDEBAR_BORDER}`,
            height: '100vh',
            overflow: 'auto',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: HEADER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? 0 : '0 20px',
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
                background: 'rgba(0, 160, 227, 0.08)',
                border: '1px solid rgba(0, 160, 227, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
              }}
            >
              <img
                src={brandMark}
                alt="CoreFlow Tech"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            {!sidebarCollapsed && (
              <div style={{ marginLeft: 10, display: 'flex', flexDirection: 'column' }}>
                <Typography.Text
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#fff',
                    fontFamily: FONT_DISPLAY,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  CoreFlow <span style={{ color: '#00A0E3' }}>Tech</span>
                </Typography.Text>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.45)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Enterprise ERP
                </span>
              </div>
            )}
          </div>
          {menuContent}
        </Sider>
      )}

      {/* Main App Content Layout */}
      <Layout style={{ height: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: isMobile ? '0 12px' : '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: HEADER_HEIGHT,
            lineHeight: `${HEADER_HEIGHT}px`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={
                isMobile ? (
                  mobileNavOpen ? (
                    <CloseOutlined />
                  ) : (
                    <MenuOutlined />
                  )
                ) : sidebarCollapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={isMobile ? () => setMobileNavOpen(open => !open) : toggleSidebar}
              style={{ fontSize: 16 }}
              aria-label="Toggle Navigation Sidebar"
            />
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <img
                  src={brandMark}
                  alt="CoreFlow"
                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                />
                <Typography.Text style={{ fontWeight: 700, fontSize: 14 }}>
                  CoreFlow <span style={{ color: '#00A0E3' }}>Tech</span>
                </Typography.Text>
              </div>
            )}
          </div>

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
                height: 34,
                paddingInline: isMobile ? 4 : 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                maxWidth: isMobile ? 140 : 200,
              }}
            >
              <Avatar
                size={24}
                style={{ background: token.colorPrimary, flexShrink: 0 }}
                icon={<UserOutlined />}
              />
              <Typography.Text ellipsis style={{ fontWeight: 500, maxWidth: isMobile ? 70 : 120 }}>
                {userName}
              </Typography.Text>
              <DownOutlined
                style={{ fontSize: 10, color: token.colorTextTertiary, flexShrink: 0 }}
              />
            </Button>
          </Dropdown>
        </Header>

        <Content
          style={{
            padding: isMobile ? '12px 10px' : 16,
            background: token.colorBgLayout,
            overflowY: 'auto',
            overflowX: 'hidden',
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              maxWidth: 1600,
              margin: '0 auto',
              width: '100%',
              minWidth: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
