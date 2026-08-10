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
  ConsumableList,
  CustomerDetail,
  CustomerForm,
  CustomerList,
  DieBlockList,
  FinishedGoodForm,
  FinishedGoodList,
  FixtureList,
  GaugeInstrumentList,
  ItemsLayout,
  MachineList,
  PackingMaterialList,
  RawMaterialForm,
  RawMaterialList,
  SupplierDetail,
  SupplierForm,
  SupplierList,
  VendorDetail,
  VendorForm,
  VendorList,
} from '@/modules/masters'
import {
  PurchaseEnquiryCompare,
  PurchaseEnquiryDetail,
  PurchaseEnquiryForm,
  PurchaseEnquiryList,
  PurchaseOrderDetail,
  PurchaseOrderForm,
  PurchaseOrderList,
  PurchaseRequisitionDetail,
  PurchaseRequisitionForm,
  PurchaseRequisitionList,
  SupplierQuotationForm,
} from '@/modules/procurement'
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
  '/masters/customers',
  '/masters/suppliers',
  '/masters/vendors',
  '/masters/finished-goods',
  '/masters/raw-materials',
  '/masters/items',
  '/purchase/requisitions',
  '/purchase/enquiries',
  '/purchase/orders',
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

                <Route path="/masters/finished-goods" element={<FinishedGoodList />} />
                <Route path="/masters/finished-goods/new" element={<FinishedGoodForm />} />
                <Route path="/masters/finished-goods/:id/edit" element={<FinishedGoodForm />} />

                <Route path="/masters/raw-materials" element={<RawMaterialList />} />
                <Route path="/masters/raw-materials/new" element={<RawMaterialForm />} />
                <Route path="/masters/raw-materials/:id/edit" element={<RawMaterialForm />} />

                <Route path="/masters/items" element={<ItemsLayout />}>
                  <Route index element={<Navigate to="consumables" replace />} />
                  <Route path="consumables" element={<ConsumableList />} />
                  <Route path="machine" element={<MachineList />} />
                  <Route path="gauges-instruments" element={<GaugeInstrumentList />} />
                  <Route path="packing-materials" element={<PackingMaterialList />} />
                  <Route path="fixtures" element={<FixtureList />} />
                  <Route path="dies-blocks" element={<DieBlockList />} />
                </Route>

                <Route path="/purchase/requisitions" element={<PurchaseRequisitionList />} />
                <Route path="/purchase/requisitions/new" element={<PurchaseRequisitionForm />} />
                <Route path="/purchase/requisitions/:id" element={<PurchaseRequisitionDetail />} />
                <Route
                  path="/purchase/requisitions/:id/edit"
                  element={<PurchaseRequisitionForm />}
                />

                <Route path="/purchase/enquiries" element={<PurchaseEnquiryList />} />
                <Route path="/purchase/enquiries/new" element={<PurchaseEnquiryForm />} />
                <Route path="/purchase/enquiries/:id" element={<PurchaseEnquiryDetail />} />
                <Route
                  path="/purchase/enquiries/:id/compare"
                  element={<PurchaseEnquiryCompare />}
                />
                <Route
                  path="/purchase/enquiries/:id/quotations/:peSupplierId"
                  element={<SupplierQuotationForm />}
                />

                <Route path="/purchase/orders" element={<PurchaseOrderList />} />
                <Route path="/purchase/orders/new" element={<PurchaseOrderForm />} />
                <Route path="/purchase/orders/:id" element={<PurchaseOrderDetail />} />

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
