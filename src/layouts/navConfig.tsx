import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  InboxOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface NavLeaf {
  path: string
  label: string
}

export interface NavGroup {
  key: string
  icon: ReactNode
  label: string
  children: NavLeaf[]
}

export const DASHBOARD_ITEM = { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' }

export const NAV_GROUPS: NavGroup[] = [
  {
    key: '/hr',
    icon: <TeamOutlined />,
    label: 'HR / User',
    children: [
      { path: '/hr/employees', label: 'Employee' },
      { path: '/hr/shifts', label: 'Shift' },
      { path: '/hr/departments', label: 'Department' },
      { path: '/hr/designations', label: 'Designation' },
      { path: '/hr/user-permissions', label: 'User Permission' },
      { path: '/hr/attendance', label: 'Attendance' },
      { path: '/hr/leave', label: 'Leave' },
      { path: '/hr/payroll', label: 'Payroll' },
      { path: '/hr/holidays', label: 'Holiday' },
    ],
  },
  {
    key: '/masters',
    icon: <AppstoreOutlined />,
    label: 'Masters',
    children: [
      { path: '/masters/customers', label: 'Customer' },
      { path: '/masters/vendors', label: 'Vendor' },
      { path: '/masters/suppliers', label: 'Supplier' },
      { path: '/masters/items', label: 'Item (RM, FG, CONS)' },
      { path: '/masters/categories', label: 'Category' },
      { path: '/masters/units', label: 'Unit' },
      { path: '/masters/terms', label: 'Terms & Conditions' },
    ],
  },
  {
    key: '/purchase',
    icon: <ShoppingCartOutlined />,
    label: 'Purchase',
    children: [
      { path: '/purchase/rfq', label: 'RFQ' },
      { path: '/purchase/orders', label: 'Purchase Order' },
      { path: '/purchase/grn', label: 'GRN' },
      { path: '/purchase/invoices', label: 'Purchase Invoice' },
    ],
  },
  {
    key: '/sales',
    icon: <ShopOutlined />,
    label: 'Sales',
    children: [
      { path: '/sales/enquiries', label: 'Sales Enquiry' },
      { path: '/sales/quotations', label: 'Quotation' },
      { path: '/sales/orders', label: 'Sales Order' },
      { path: '/sales/delivery-challans', label: 'Delivery Challan' },
      { path: '/sales/invoices', label: 'Sales Invoice' },
    ],
  },
  {
    key: '/inventory',
    icon: <InboxOutlined />,
    label: 'Inventory',
    children: [
      { path: '/inventory/locations', label: 'Store Location' },
      { path: '/inventory/transfers', label: 'Stock Transfer' },
      { path: '/inventory/adjustments', label: 'Stock Adjustment' },
      { path: '/inventory/ledger', label: 'Stock Ledger' },
    ],
  },
  {
    key: '/production',
    icon: <ToolOutlined />,
    label: 'Production',
    children: [
      { path: '/production/bom', label: 'BOM' },
      { path: '/production/work-orders', label: 'Work Order (Jobcard)' },
      { path: '/production/entries', label: 'Production Entry' },
    ],
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
    children: [
      { path: '/reports/sales', label: 'Sales' },
      { path: '/reports/purchase', label: 'Purchase' },
      { path: '/reports/inventory', label: 'Inventory' },
      { path: '/reports/hr', label: 'HR' },
      { path: '/reports/production', label: 'Production' },
    ],
  },
]

export const ALL_NAV_LEAVES: NavLeaf[] = NAV_GROUPS.flatMap(group => group.children)
