import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { EmployeeDetail, EmployeeForm, EmployeeList } from '@/modules/hr'
import { Dashboard } from '@/pages/Dashboard'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: {
            bodyBg: '#f5f5f5',
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/hr/employees" element={<EmployeeList />} />
              <Route path="/hr/employees/new" element={<EmployeeForm />} />
              <Route path="/hr/employees/:id" element={<EmployeeDetail />} />
              <Route path="/hr/employees/:id/edit" element={<EmployeeForm />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
