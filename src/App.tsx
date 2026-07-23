import { App as AntApp, ConfigProvider } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/RequireAuth'
import { AppLayout } from '@/layouts/AppLayout'
import { ALL_NAV_LEAVES } from '@/layouts/navConfig'
import {
  DepartmentList,
  DesignationList,
  EmployeeDetail,
  EmployeeForm,
  EmployeeList,
  ShiftList,
} from '@/modules/hr'
import {
  CityList,
  CountryList,
  CustomerDetail,
  CustomerForm,
  CustomerList,
  StateList,
  SupplierDetail,
  SupplierForm,
  SupplierList,
  VendorDetail,
  VendorForm,
  VendorList,
} from '@/modules/masters'
import { ComingSoon } from '@/pages/ComingSoon'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { ANTD_THEME } from '@/theme/antd-theme'

// Sidebar leaves that already have a real page — everything else in
// navConfig falls back to a ComingSoon placeholder route below.
const IMPLEMENTED_PATHS = new Set([
  '/hr/employees',
  '/hr/departments',
  '/hr/designations',
  '/hr/shifts',
  '/masters/countries',
  '/masters/states',
  '/masters/cities',
  '/masters/customers',
  '/masters/suppliers',
  '/masters/vendors',
])

function App() {
  return (
    <ConfigProvider theme={ANTD_THEME}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="/hr/employees" element={<EmployeeList />} />
                <Route path="/hr/employees/new" element={<EmployeeForm />} />
                <Route path="/hr/employees/:id" element={<EmployeeDetail />} />
                <Route path="/hr/employees/:id/edit" element={<EmployeeForm />} />
                <Route path="/hr/departments" element={<DepartmentList />} />
                <Route path="/hr/designations" element={<DesignationList />} />
                <Route path="/hr/shifts" element={<ShiftList />} />

                <Route path="/masters/countries" element={<CountryList />} />
                <Route path="/masters/states" element={<StateList />} />
                <Route path="/masters/cities" element={<CityList />} />

                <Route path="/masters/customers" element={<CustomerList />} />
                <Route path="/masters/customers/new" element={<CustomerForm />} />
                <Route path="/masters/customers/:id" element={<CustomerDetail />} />
                <Route path="/masters/customers/:id/edit" element={<CustomerForm />} />

                <Route path="/masters/suppliers" element={<SupplierList />} />
                <Route path="/masters/suppliers/new" element={<SupplierForm />} />
                <Route path="/masters/suppliers/:id" element={<SupplierDetail />} />
                <Route path="/masters/suppliers/:id/edit" element={<SupplierForm />} />

                <Route path="/masters/vendors" element={<VendorList />} />
                <Route path="/masters/vendors/new" element={<VendorForm />} />
                <Route path="/masters/vendors/:id" element={<VendorDetail />} />
                <Route path="/masters/vendors/:id/edit" element={<VendorForm />} />

                {ALL_NAV_LEAVES.filter(leaf => !IMPLEMENTED_PATHS.has(leaf.path)).map(leaf => (
                  <Route
                    key={leaf.path}
                    path={leaf.path}
                    element={<ComingSoon title={leaf.label} />}
                  />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
