import seoRoutesJson from './seo-routes.json'

export interface SeoRoute {
  path: string
  title: string
  description: string
}

// Single source of truth, shared with scripts/prerender-seo.mjs (a plain
// Node script run after `vite build`) so per-route <title>/description stay
// in sync between the static prerendered HTML crawlers see and the
// client-side updates React makes during navigation.
export const SEO_ROUTES: SeoRoute[] = seoRoutesJson

export const SITE_URL = 'https://coreflowtech.com'
export const SITE_NAME = 'CoreFlowTech'
export const OG_IMAGE_PATH = '/og-image.png'

export function getSeoForPath(pathname: string): SeoRoute {
  return (
    SEO_ROUTES.find(route => route.path === pathname) ?? {
      path: pathname,
      title: SEO_ROUTES[0].title,
      description: SEO_ROUTES[0].description,
    }
  )
}
