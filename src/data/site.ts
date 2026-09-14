export const COMPANY = {
  name: 'CoreFlowTech',
  tagline: 'Enterprise Resource Planning Solutions',
  address: 'Suvarnabhoomi, near Speed Well Party Plot, Ambika Township, Rajkot 360004',
  phone: '+91 97730 84699',
  email: 'hello@coreflowtech.com',
}

export interface NavItem {
  label: string
  path: string
  children?: { label: string; path: string; description: string }[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  {
    label: 'Services',
    path: '/services',
    children: [
      {
        label: 'ERP Solutions',
        path: '/services/erp-solutions',
        description: 'Unified ERP built around how your business actually runs.',
      },
      {
        label: 'Web Development',
        path: '/services/web-development',
        description: 'Fast, modern websites and web platforms.',
      },
    ],
  },
  { label: 'Industries', path: '/industries' },
  { label: 'Products', path: '/products' },
  { label: 'Contact', path: '/contact' },
]

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', path: '/about' },
    { label: 'Industries', path: '/industries' },
    { label: 'Products', path: '/products' },
    { label: 'Contact', path: '/contact' },
  ],
  services: [
    { label: 'ERP Solutions', path: '/services/erp-solutions' },
    { label: 'Web Development', path: '/services/web-development' },
    { label: 'All Services', path: '/services' },
  ],
}

export interface ErpModule {
  key: string
  title: string
  description: string
  points: string[]
}

export const ERP_MODULES: ErpModule[] = [
  {
    key: 'hr',
    title: 'HR & Payroll',
    description: 'Employee records, attendance, leave, shifts and payroll — run together.',
    points: ['Employee lifecycle & documents', 'Attendance and shift rostering', 'Automated payroll runs'],
  },
  {
    key: 'finance',
    title: 'Finance & Accounting',
    description: 'Ledgers, invoicing and reporting that stay in sync with every other module.',
    points: ['GST-ready invoicing', 'Ledgers & bank reconciliation', 'Real-time financial reports'],
  },
  {
    key: 'inventory',
    title: 'Inventory & Stock',
    description: 'Know exactly what you have, where it sits, and what it cost.',
    points: ['Multi-location stock tracking', 'Batch, heat & serial tracking', 'Stock transfers & adjustments'],
  },
  {
    key: 'production',
    title: 'Production & Manufacturing',
    description: 'Job cards, process routes, BOMs and shop-floor tracking in one flow.',
    points: ['Configurable process routes', 'BOM & material issue tracking', 'Job card progress in real time'],
  },
  {
    key: 'procurement',
    title: 'Procurement',
    description: 'From requisition to GRN, with full visibility on supplier performance.',
    points: ['Purchase requisitions & orders', 'Supplier quotation comparison', 'Goods receipt & quality checks'],
  },
  {
    key: 'sales',
    title: 'Sales & CRM',
    description: 'Quotes, orders and customer relationships, tracked end to end.',
    points: ['Sales enquiries & quotations', 'Order & delivery tracking', 'Customer history at a glance'],
  },
]

export const ERP_BENEFITS = [
  {
    title: 'One source of truth',
    description: 'Every department works off the same live data — no spreadsheets, no re-keying.',
  },
  {
    title: 'Built for your process',
    description: 'Modules configure to match how your shop floor and back office actually work.',
  },
  {
    title: 'Scales as you grow',
    description: 'Start with the modules you need today, add more without re-platforming.',
  },
  {
    title: 'Real-time visibility',
    description: 'Dashboards and reports that reflect what is happening right now, not last week.',
  },
]

export const ERP_WORKFLOW = [
  { step: '01', title: 'Discover', description: 'We map your current process, data and pain points.' },
  { step: '02', title: 'Configure', description: 'Modules, roles and workflows are set up around your business.' },
  { step: '03', title: 'Migrate', description: 'Your existing data moves in, validated and clean.' },
  { step: '04', title: 'Go live', description: 'Your team launches with training and hands-on support.' },
  { step: '05', title: 'Improve', description: 'We keep tuning the system as your business evolves.' },
]

export interface Industry {
  key: string
  name: string
  description: string
}

export const INDUSTRIES: Industry[] = [
  {
    key: 'engineering',
    name: 'Engineering & Manufacturing',
    description: 'Job-card driven production, BOM control and shop-floor tracking.',
  },
  {
    key: 'medicine',
    name: 'Medicine & Healthcare',
    description: 'Batch-tracked inventory, compliance-friendly records and audit trails.',
  },
  {
    key: 'tech',
    name: 'Technology',
    description: 'Lean back-office ops for product and service-driven tech companies.',
  },
  {
    key: 'retail',
    name: 'Retail & Distribution',
    description: 'Multi-location stock, sales and purchase flows in one platform.',
  },
  {
    key: 'logistics',
    name: 'Logistics & Warehousing',
    description: 'Stock movement, transfers and location-level visibility.',
  },
  {
    key: 'trading',
    name: 'Trading & Wholesale',
    description: 'Quotation-to-invoice flows built for high transaction volume.',
  },
]

export interface Product {
  key: string
  name: string
  category: string
  description: string
}

export const PRODUCTS: Product[] = [
  {
    key: 'flowdesk',
    name: 'FlowDesk',
    category: 'Internal Tools',
    description: 'A lightweight helpdesk and ticketing tool for internal IT and support teams.',
  },
  {
    key: 'pulseboard',
    name: 'PulseBoard',
    category: 'Analytics',
    description: 'Real-time ops dashboards that pull metrics from your existing systems.',
  },
  {
    key: 'shiftsync',
    name: 'ShiftSync',
    category: 'Workforce',
    description: 'Shift planning and attendance for teams working across multiple sites.',
  },
]

export interface Stat {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  label: string
}

export const STATS: Stat[] = [
  { value: 10, suffix: '+', label: 'Industries served' },
  { value: 25, suffix: '+', label: 'Modules shipped' },
  { value: 99.9, decimals: 1, suffix: '%', label: 'Uptime target' },
  { value: 24, suffix: '/7', label: 'Support availability' },
]

export const MARQUEE_ITEMS = [
  'Engineering',
  'Healthcare',
  'Technology',
  'Manufacturing',
  'Retail',
  'Logistics',
  'Trading',
]

export const FAQS = [
  {
    question: 'How long does an ERP rollout actually take?',
    answer:
      'It depends on how many modules you start with and how clean your existing data is. Most teams are live on their first module set within a few weeks of configuration being agreed, following the same five-step process for every rollout.',
  },
  {
    question: 'Can we start with just one or two modules?',
    answer:
      'Yes — the platform is modular by design. Most teams start with the module causing the most pain today (often inventory or job cards) and add the rest once that is bedded in.',
  },
  {
    question: "What if our industry isn't listed?",
    answer:
      'The industries we list are the ones we have built for most, not a hard limit. If your business runs on defined processes rather than a rigid template, there is a good chance we can configure the platform for it — worth a conversation either way.',
  },
  {
    question: 'Do you support us after go-live?',
    answer:
      'Yes. Implementation does not end at launch — the last step of our process is ongoing tuning as your business evolves, and our team stays reachable for support after that.',
  },
  {
    question: 'Can you build custom features specific to our workflow?',
    answer:
      'Yes. Beyond configuring existing modules, we build custom workflow logic and, where needed, custom web platforms — that is the Web Development side of what we do.',
  },
]
