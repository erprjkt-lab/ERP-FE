import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { ALL_NAV_LEAVES } from '@/layouts/navConfig'
import { EmployeeDetail, EmployeeForm, EmployeeList } from '@/modules/hr'
import { ComingSoon } from '@/pages/ComingSoon'
import { Dashboard } from '@/pages/Dashboard'
import { ANTD_THEME } from '@/theme/antd-theme'

// Sidebar leaves that already have a real page — everything else in
// navConfig falls back to a ComingSoon placeholder route below.
const IMPLEMENTED_PATHS = new Set(['/hr/employees'])

function App() {
  return (
    <ConfigProvider theme={ANTD_THEME}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/hr/employees" element={<EmployeeList />} />
              <Route path="/hr/employees/new" element={<EmployeeForm />} />
              <Route path="/hr/employees/:id" element={<EmployeeDetail />} />
              <Route path="/hr/employees/:id/edit" element={<EmployeeForm />} />
              {ALL_NAV_LEAVES.filter(leaf => !IMPLEMENTED_PATHS.has(leaf.path)).map(leaf => (
                <Route
                  key={leaf.path}
                  path={leaf.path}
                  element={<ComingSoon title={leaf.label} />}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
