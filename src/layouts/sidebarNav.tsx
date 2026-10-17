import {
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { REPORTS } from '@/modules/reports/reportRegistry'
import type { ApiSidebarNode } from '@/types/api/rbac'

// Shaped to drop straight into antd's Menu `items`, whose own union keeps leaves and
// submenus apart — hence the `type` discriminant and the required `children`.
// Type aliases, not interfaces: antd's item types carry a `data-*` index signature,
// which only an alias satisfies implicitly.
export type SidebarLeaf = {
  type?: 'item'
  /** The route this entry navigates to. */
  key: string
  label: string
  icon?: ReactNode
}

export type SidebarSubmenu = {
  type?: 'submenu'
  /** Synthetic (`folder-<id>` / `module-<id>`) — submenus aren't navigable. */
  key: string
  label: string
  icon?: ReactNode
  children: SidebarItem[]
}

export type SidebarItem = SidebarLeaf | SidebarSubmenu

const isSubmenu = (item: SidebarItem): item is SidebarSubmenu => 'children' in item

/**
 * ERP-BE rbac module_key (config/rbac_modules.php) → the page(s) this app has for it.
 * The sidebar's labels and nesting come from GET /menus/sidebar; this only says where
 * each module's menu entry should navigate to. A module with several pages (one BE
 * module backs more than one screen here) becomes a submenu; one with none falls back
 * to a /pending placeholder so the user still sees it in the tree.
 */
export const MODULE_PAGES: Record<string, { path: string; label: string }[]> = {
  // BE ships its own top-level `dashboard` module; point it at the real page so
  // it doesn't fall through to the /pending placeholder as a second entry.
  dashboard: [{ path: '/', label: 'Dashboard' }],

  employees: [{ path: '/hr/employees', label: 'Employees' }],
  departments: [{ path: '/hr/departments', label: 'Departments' }],
  designations: [{ path: '/hr/designations', label: 'Designations' }],
  shifts: [{ path: '/hr/shifts', label: 'Shifts' }],
  permissions: [{ path: '/hr/user-permissions', label: 'Permissions' }],

  customers: [{ path: '/masters/customers', label: 'Customers' }],
  suppliers: [{ path: '/masters/suppliers', label: 'Suppliers' }],
  vendors: [{ path: '/masters/vendors', label: 'Vendors' }],
  uom: [{ path: '/masters/units', label: 'Units of Measure' }],
  'finished-goods': [{ path: '/masters/finished-goods', label: 'Finished Goods' }],
  'raw-materials': [{ path: '/masters/raw-materials', label: 'Raw Materials' }],
  consumables: [{ path: '/masters/items/consumables', label: 'Consumables' }],
  machines: [{ path: '/masters/items/machine', label: 'Machines' }],
  'gauge-instruments': [
    { path: '/masters/items/gauges-instruments', label: 'Gauge & Instruments' },
  ],
  'packing-materials': [{ path: '/masters/items/packing-materials', label: 'Packing Materials' }],
  'item-categories': [{ path: '/hsn-category-grade/item-categories', label: 'Item Categories' }],
  'hsn-codes': [{ path: '/hsn-category-grade/hsn-codes', label: 'HSN Codes' }],
  'material-grades': [{ path: '/hsn-category-grade/material-grades', label: 'Material Grades' }],
  processes: [{ path: '/production/process', label: 'Processes' }],
  'rejection-reasons': [{ path: '/production/rejection-reasons', label: 'Rejection Reasons' }],
  'item-bom': [{ path: '/production/bom', label: 'Item BOM' }],

  'purchase-requisitions': [{ path: '/purchase/requisitions', label: 'Purchase Requisitions' }],
  'purchase-enquiries': [{ path: '/purchase/enquiries', label: 'Purchase Enquiries' }],
  'purchase-orders': [{ path: '/purchase/orders', label: 'Purchase Orders' }],
  grn: [{ path: '/purchase/grn', label: 'Goods Receipt Notes' }],

  'sales-enquiries': [{ path: '/sales/enquiries', label: 'Sales Enquiries' }],
  'sales-quotations': [{ path: '/sales/quotations', label: 'Sales Quotations' }],
  'sales-orders': [{ path: '/sales/orders', label: 'Sales Orders' }],
  'delivery-challans': [{ path: '/sales/delivery-challans', label: 'Delivery Challans' }],
  'sales-invoices': [{ path: '/sales/invoices', label: 'Sales Invoices' }],

  stock: [
    { path: '/inventory/stock-balance', label: 'Stock Balance' },
    { path: '/inventory/ledger', label: 'Stock Ledger' },
  ],
  'stock-requisitions': [{ path: '/inventory/requisitions', label: 'Stock Requisitions' }],
  'stock-issues': [{ path: '/inventory/stock-issues', label: 'Stock Issues' }],
  'stock-adjustments': [{ path: '/inventory/adjustments', label: 'Stock Adjustments' }],
  'opening-stock': [{ path: '/inventory/opening-stock', label: 'Opening Stock' }],
  'stock-transfer': [{ path: '/inventory/transfers', label: 'Stock Transfer' }],
  locations: [{ path: '/inventory/locations', label: 'Store Locations' }],

  'job-cards': [{ path: '/production/work-orders', label: 'Work Orders (Job Cards)' }],
  'job-card-challans': [{ path: '/production/outsource', label: 'Outsource' }],
  rejections: [
    { path: '/production/rejection-review', label: 'Rejection Review' },
    { path: '/production/entries', label: 'Production Entry' },
  ],

  'inspection-parameters': [
    { path: '/quality/inspection-parameters', label: 'Inspection Parameters' },
  ],

  'customer-complaints': [{ path: '/quality/customer-complaints', label: 'Customer Complaints' }],

  // Two key shapes, both live. Deployments running the current registry send one
  // consolidated `inspection-reports` module; the one this app is pointed at
  // sends `ipr`/`fir`/`iir` as three separate modules (confirmed: its menu drove
  // the sidebar to /pending/ipr). Mapping both means either backend reaches the
  // same three screens — the same approach the report modules below take.
  ipr: [{ path: '/quality/ipr', label: 'IPR' }],
  fir: [{ path: '/quality/fir', label: 'FIR' }],
  iir: [{ path: '/quality/iir', label: 'IIR' }],

  'inspection-reports': [
    { path: '/quality/ipr', label: 'IPR' },
    { path: '/quality/fir', label: 'FIR' },
    { path: '/quality/iir', label: 'IIR' },
  ],

  // Reports are never listed individually in the sidebar — see isReportsFolder.
  // Mapping the module keys anyway gives /reports its entry in the route-level
  // permission map, and covers both key shapes ERP-BE has shipped.
  ...Object.fromEntries(
    [
      ...['sales', 'purchase', 'inventory', 'hr', 'production'].map(a => `reports-${a}`),
      ...REPORTS.map(report => `report-${report.slug}`),
    ].map(key => [key, [{ path: '/reports', label: 'Reports' }]]),
  ),
}

/**
 * Sidebar label override for modules ERP-BE's registry names after one of their
 * own screens. `config/rbac_modules.php` labels `inspection-reports` "IIR" even
 * though that one module backs IPR, FIR *and* IIR here, and labels
 * `inspection-parameters` "IPR" — which is the name of a different report. Taken
 * literally, Quality renders an "IIR" group containing IPR/FIR/IIR next to a
 * separate "IPR" entry that opens the parameter master, so the real reports look
 * missing.
 *
 * Deliberately a short, explicit list rather than "always prefer the FE label":
 * every other module's wording is ERP-BE's to own and rename. The proper fix is
 * in the BE registry; remove the entry here once its label is corrected.
 */
const MODULE_LABEL_OVERRIDES: Record<string, string> = {
  'inspection-reports': 'Inspection Reports',
  'inspection-parameters': 'Inspection Parameters',
}

// BE icon names (feather-style, from the module registry) → the antd icon we render.
const ICONS: Record<string, ReactNode> = {
  home: <DashboardOutlined />,
  settings: <SettingOutlined />,
  database: <AppstoreOutlined />,
  box: <AppstoreOutlined />,
  'shopping-cart': <ShoppingCartOutlined />,
  'trending-up': <ShopOutlined />,
  package: <InboxOutlined />,
  cpu: <ToolOutlined />,
  'check-circle': <SafetyCertificateOutlined />,
  'bar-chart-2': <BarChartOutlined />,
}

export const pendingPath = (moduleKey: string) => `/pending/${moduleKey}`

/** Reports never expand in the sidebar: the folder collapses to a single link to
 * the /reports landing page, which lists every report the user may open. The
 * folder itself still disappears when the employee has no report permission,
 * because ERP-BE sends no children in that case.
 *
 * Matched on the children's module keys rather than the folder's label, which BE
 * can rename. The prefix is `report` — not `report-` or `reports-` — because
 * ERP-BE has shipped both: one module per report (`report-<slug>`) and one per
 * area (`reports-<area>`). A deployment can be on either. */
const isReportsFolder = (node: ApiSidebarNode) =>
  node.children.length > 0 && node.children.every(child => child.module_key?.startsWith('report'))

/**
 * Turns the BE's permission-filtered menu tree into antd Menu items. Only the top
 * level carries an icon, matching how the sidebar was laid out before.
 */
export function buildSidebarItems(nodes: ApiSidebarNode[], depth = 0): SidebarItem[] {
  const items: SidebarItem[] = []

  for (const node of [...nodes].sort((a, b) => a.sequence - b.sequence)) {
    const icon = depth === 0 ? ICONS[node.icon ?? ''] : undefined
    const childItems = buildSidebarItems(node.children, depth + 1)

    // Folder node: structural only, so drop it when nothing inside is visible.
    if (!node.module_key) {
      if (childItems.length === 0) continue

      if (isReportsFolder(node)) {
        items.push({ key: '/reports', label: node.name, icon })
      } else {
        items.push({ key: `folder-${node.id}`, label: node.name, icon, children: childItems })
      }
      continue
    }

    const pages = MODULE_PAGES[node.module_key] ?? []
    const pageItems = pages.map(page => ({ key: page.path, label: page.label }))
    const children = [...pageItems, ...childItems]
    const label = MODULE_LABEL_OVERRIDES[node.module_key] ?? node.name

    if (children.length > 1) {
      items.push({ key: `module-${node.id}`, label, icon, children })
    } else {
      items.push({
        key: children[0]?.key ?? pendingPath(node.module_key),
        label,
        icon,
      })
    }
  }

  return items
}

/**
 * Longest-prefix match of the current route against the sidebar's leaf paths, plus the
 * submenu keys above it — so deep routes (e.g. a detail page) still highlight and open
 * their parent.
 */
export function findActiveKeys(
  items: SidebarItem[],
  pathname: string,
): { selectedKey?: string; openKeys: string[] } {
  let best: { selectedKey: string; openKeys: string[] } | undefined

  const walk = (nodes: SidebarItem[], ancestors: string[]) => {
    for (const node of nodes) {
      if (isSubmenu(node)) {
        walk(node.children, [...ancestors, node.key])
        continue
      }
      const isMatch = pathname === node.key || pathname.startsWith(`${node.key}/`)
      if (isMatch && (!best || node.key.length > best.selectedKey.length)) {
        best = { selectedKey: node.key, openKeys: ancestors }
      }
    }
  }
  walk(items, [])

  return { selectedKey: best?.selectedKey, openKeys: best?.openKeys ?? [] }
}

/** The submenu keys from the root down to `key` — used to keep one branch open. */
export function getKeyPath(items: SidebarItem[], key: string): string[] {
  for (const node of items) {
    if (node.key === key) return [key]
    if (isSubmenu(node)) {
      const path = getKeyPath(node.children, key)
      if (path.length > 0) return [node.key, ...path]
    }
  }
  return []
}
