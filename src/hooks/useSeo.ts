import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSeoForPath, SEO_ROUTES, SITE_URL } from '@/data/seo'

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (el) el.setAttribute(attr, value)
}

/**
 * Keeps the tab title, meta description, canonical link and Open Graph/Twitter
 * tags in sync with the current route on the client.
 *
 * This does NOT help social-media link-preview crawlers (WhatsApp, LinkedIn,
 * Facebook, Slack) — they read the raw HTML without running JS, so per-route
 * previews come from the static files scripts/prerender-seo.mjs generates at
 * build time. This hook covers the browser tab title for real users
 * navigating client-side, and Google's renderer (which does execute JS).
 */
export function useSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const known = SEO_ROUTES.some(route => route.path === pathname)
    const { title, description } = getSeoForPath(pathname)
    const url = `${SITE_URL}${pathname}`

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="robots"]', 'content', known ? 'index, follow' : 'noindex, nofollow')
  }, [pathname])
}
