import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getBreadcrumbs, getSeoForPath, SEO_ROUTES, SITE_NAME, SITE_URL } from '@/data/seo'

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (el) el.setAttribute(attr, value)
}

/** Creates (once) or replaces the JSON-LD <script> tag with this id, so
 * client-side navigation swaps the content instead of accumulating duplicate
 * script tags on every route change. */
function setJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * Keeps the tab title, meta description, canonical link, Open Graph/Twitter
 * tags and per-page JSON-LD in sync with the current route on the client.
 *
 * This does NOT help social-media link-preview crawlers (WhatsApp, LinkedIn,
 * Facebook, Slack) or non-JS text crawlers (GPTBot, ClaudeBot, PerplexityBot)
 * — they read the raw HTML without running JS, so per-route previews and
 * structured data come from the static files scripts/prerender-seo.mjs
 * generates at build time. This hook covers the browser tab for real users
 * navigating client-side, and Google's renderer (which does execute JS).
 */
export function useSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const known = SEO_ROUTES.some(route => route.path === pathname)
    const { title, description, image } = getSeoForPath(pathname)
    const url = `${SITE_URL}${pathname}`
    const imageUrl = `${SITE_URL}${image}`

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:image"]', 'content', imageUrl)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', imageUrl)
    setMeta('meta[name="robots"]', 'content', known ? 'index, follow' : 'noindex, nofollow')

    if (!known) return

    const breadcrumbs = getBreadcrumbs(pathname)
    setJsonLd('ld-webpage', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    })
    setJsonLd('ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.label,
        item: `${SITE_URL}${crumb.path}`,
      })),
    })
  }, [pathname])
}
