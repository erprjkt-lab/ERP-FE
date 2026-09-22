import seoRoutesJson from './seo-routes.json'

export interface SeoRoute {
  path: string
  title: string
  description: string
  image: string
  /** Label for this page's own breadcrumb crumb (the last one in the trail). */
  breadcrumbLabel: string
}

// Single source of truth, shared with scripts/prerender-seo.mjs (a plain
// Node script run after `vite build`) so per-route <title>/description/image
// and JSON-LD stay in sync between the static prerendered HTML crawlers see
// and the client-side updates React makes during navigation.
export const SEO_ROUTES: SeoRoute[] = seoRoutesJson

export const SITE_URL = 'https://www.coreflowtech.in'
export const SITE_NAME = 'CoreFlowTech'
export const OG_IMAGE_PATH = '/og-image.png'

// Labels for path segments that don't have their own SEO_ROUTES entry (a
// parent segment in a nested path, e.g. "services" in "/services/erp-solutions"
// — the page at /services already supplies its own label from breadcrumbLabel).
const SEGMENT_LABELS: Record<string, string> = {
  services: 'Services',
}

export interface Breadcrumb {
  label: string
  path: string
}

/** Home > Services > ERP Solutions, derived from the path — used for both the
 * on-page trail and BreadcrumbList JSON-LD. */
export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/') return [{ label: 'Home', path: '/' }]

  const segments = pathname.split('/').filter(Boolean)
  const crumbs: Breadcrumb[] = [{ label: 'Home', path: '/' }]

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const route = SEO_ROUTES.find(r => r.path === currentPath)
    crumbs.push({ label: route?.breadcrumbLabel ?? SEGMENT_LABELS[segment] ?? segment, path: currentPath })
  }

  return crumbs
}

const NOT_FOUND_SEO: SeoRoute = {
  path: '',
  title: 'Page Not Found | CoreFlowTech',
  description: "The page you're looking for doesn't exist or may have moved.",
  image: OG_IMAGE_PATH,
  breadcrumbLabel: 'Page Not Found',
}

// Used for a route not in SEO_ROUTES — a real 404, not a stand-in for the
// homepage. Static builds render dist/404.html separately via
// scripts/prerender-seo.mjs; this covers the same case for client-side SPA
// navigation to a bad URL.
export function getSeoForPath(pathname: string): SeoRoute {
  return SEO_ROUTES.find(route => route.path === pathname) ?? { ...NOT_FOUND_SEO, path: pathname }
}
