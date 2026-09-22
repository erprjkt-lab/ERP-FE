// Runs after `vite build` (client) and `vite build --ssr` (server bundle, see
// the `build:ssr` script). Generates a static dist/<route>/index.html per page
// with that page's own <title>/description/OG/Twitter tags, its own
// WebPage/BreadcrumbList JSON-LD, AND its actual rendered content baked in.
// Also generates a real dist/404.html for unmatched routes.
//
// Why the meta tags: this is a client-side-only React SPA — social crawlers
// (WhatsApp, LinkedIn, Facebook, Slack, iMessage) fetch the raw HTML and read
// meta tags WITHOUT running JavaScript, so a hook that updates document.title
// after mount (see src/hooks/useSeo.ts) is invisible to them. Writing an
// actual static file per route is what makes sharing e.g.
// /services/erp-solutions show that page's own preview card instead of the
// homepage's.
//
// Why the rendered content: the same "no JavaScript" limitation applies to
// text-only crawlers that don't render pages at all — GPTBot, ClaudeBot,
// PerplexityBot and similar. Without this step, every route's <div id="root">
// ships empty and those crawlers see a blank page. Rendering each route to
// static HTML via entry-server.tsx's renderToStaticMarkup gives them real
// text. Real visitors still get the normal client-rendered app: main.tsx
// hydrates onto this markup rather than discarding it.
//
// Vercel serves an exact file match (dist/about/index.html) for a request to
// that path; there is deliberately no SPA catch-all rewrite (see vercel.json)
// so a path that doesn't match one of these files, or dist/404.html, falls
// through to Vercel's own 404 — every real route already has its own static
// file, so nothing legitimate depends on a catch-all.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const distDir = path.join(rootDir, 'dist')
const ssrDir = path.join(rootDir, 'dist-ssr')
const routes = JSON.parse(readFileSync(path.join(rootDir, 'src/data/seo-routes.json'), 'utf-8'))
const SITE_URL = 'https://www.coreflowtech.in'
const SITE_NAME = 'CoreFlowTech'

const template = readFileSync(path.join(distDir, 'index.html'), 'utf-8')

const ssrEntry = path.join(ssrDir, 'entry-server.js')
if (!existsSync(ssrEntry)) {
  throw new Error(
    `Missing ${ssrEntry} — run "npm run build:ssr" (or "npm run build", which does this for you) before prerendering.`,
  )
}
const { render } = await import(pathToFileURL(ssrEntry).href)

function replaceTagContent(html, findAttr, findValue, newContent) {
  const pattern = new RegExp(`(<[^>]*\\b${findAttr}="${findValue}"[^>]*\\b(?:content|href)=")[^"]*(")`)
  if (!pattern.test(html)) {
    console.warn(`  ! pattern not found for ${findAttr}="${findValue}"`)
  }
  return html.replace(pattern, `$1${newContent}$2`)
}

/** Fills (or refills) the empty <script id="ld-xxx"> placeholders that live
 * in index.html — see src/hooks/useSeo.ts, which targets the same ids to
 * keep client-side navigation in sync. */
function setJsonLdPlaceholder(html, id, data) {
  const pattern = new RegExp(`(<script type="application/ld\\+json" id="${id}">)[^<]*(</script>)`)
  if (!pattern.test(html)) {
    throw new Error(`Missing <script id="${id}"> placeholder in the HTML template`)
  }
  return html.replace(pattern, `$1${JSON.stringify(data)}$2`)
}

/** Appends an extra JSON-LD block before </head> — for schema that only
 * applies to specific routes (e.g. SoftwareApplication on the ERP page)
 * rather than every page, so it isn't wired as a shared placeholder. */
function appendJsonLd(html, data) {
  const script = `    <script type="application/ld+json">${JSON.stringify(data)}</script>\n  </head>`
  return html.replace('</head>', script)
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

// Mirrors src/data/seo.ts's getBreadcrumbs — duplicated rather than shared
// because this script runs in plain Node against compiled JSON, not through
// the TS/Vite pipeline. Keep the two in sync if the logic changes.
const SEGMENT_LABELS = { services: 'Services' }
function getBreadcrumbs(routePath) {
  if (routePath === '/') return [{ label: 'Home', path: '/' }]
  const segments = routePath.split('/').filter(Boolean)
  const crumbs = [{ label: 'Home', path: '/' }]
  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const route = routes.find(r => r.path === currentPath)
    crumbs.push({ label: route?.breadcrumbLabel ?? SEGMENT_LABELS[segment] ?? segment, path: currentPath })
  }
  return crumbs
}

/** Every <script type="application/ld+json"> in the file must actually be
 * valid JSON — a typo here ships broken structured data to every crawler
 * with no build-time signal, so fail the build instead. */
function assertValidJsonLd(html, label) {
  const blocks = html.matchAll(/<script type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g)
  for (const [, content] of blocks) {
    if (!content.trim()) continue
    try {
      JSON.parse(content)
    } catch (error) {
      throw new Error(`Invalid JSON-LD in ${label}: ${error.message}\n${content}`)
    }
  }
}

for (const route of routes) {
  const url = `${SITE_URL}${route.path}`
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)
  const imageUrl = `${SITE_URL}${route.image}`

  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceTagContent(html, 'name', 'description', description)
  html = replaceTagContent(html, 'rel', 'canonical', url)
  html = replaceTagContent(html, 'property', 'og:title', title)
  html = replaceTagContent(html, 'property', 'og:description', description)
  html = replaceTagContent(html, 'property', 'og:url', url)
  html = replaceTagContent(html, 'property', 'og:image', imageUrl)
  html = replaceTagContent(html, 'name', 'twitter:title', title)
  html = replaceTagContent(html, 'name', 'twitter:description', description)
  html = replaceTagContent(html, 'name', 'twitter:image', imageUrl)

  const breadcrumbs = getBreadcrumbs(route.path)
  html = setJsonLdPlaceholder(html, 'ld-webpage', {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: route.title,
    description: route.description,
    url,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  })
  html = setJsonLdPlaceholder(html, 'ld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: `${SITE_URL}${crumb.path}`,
    })),
  })

  // Genuinely applicable only here — this is the one page actually
  // describing the ERP product itself. No price/offers/rating: none of
  // that is real, so none of it is claimed.
  if (route.path === '/services/erp-solutions') {
    html = appendJsonLd(html, {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CoreFlowTech ERP',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: route.description,
      url,
    })
  }

  const bodyHtml = render(route.path)
  if (!html.includes('<div id="root"></div>')) {
    throw new Error(`dist/index.html template is missing the expected empty <div id="root"></div>`)
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

  assertValidJsonLd(html, route.path)

  const outDir = route.path === '/' ? distDir : path.join(distDir, route.path)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'index.html'), html)
  console.log(`✓ ${route.path === '/' ? '/' : route.path + '/'}index.html`)
}

// A real 404 page: same shell, its own title/robots, none of the per-route
// JSON-LD placeholders (an error page has no canonical content to describe —
// left empty they'd be invalid JSON-LD, so they're stripped instead). Paired
// with vercel.json having no catch-all rewrite, Vercel serves this file with
// a genuine 404 status for any path that isn't one of the routes above.
{
  const notFoundTitle = 'Page Not Found | CoreFlowTech'
  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${notFoundTitle}</title>`)
  html = replaceTagContent(html, 'name', 'description', "The page you're looking for doesn't exist or may have moved.")
  html = replaceTagContent(html, 'property', 'og:title', notFoundTitle)
  html = replaceTagContent(html, 'name', 'twitter:title', notFoundTitle)
  html = replaceTagContent(html, 'name', 'robots', 'noindex, nofollow')
  html = html.replace(
    /<script type="application\/ld\+json" id="ld-webpage"><\/script>\s*<script type="application\/ld\+json" id="ld-breadcrumb"><\/script>\n?/,
    '',
  )

  const bodyHtml = render('/__not_found__')
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

  assertValidJsonLd(html, '404')
  writeFileSync(path.join(distDir, '404.html'), html)
  console.log('✓ 404.html')
}

// Intermediate build artifact only — never deployed, and stale files here
// would otherwise silently keep getting reused by the next build.
rmSync(ssrDir, { recursive: true, force: true })

// Depth-based priority: the homepage outranks top-level pages, which outrank
// nested ones. changefreq/priority are only hints, but lastmod is worth being
// accurate about — crawlers use it to decide whether a refetch is warranted.
const buildDate = new Date().toISOString().slice(0, 10)

function priorityFor(routePath) {
  if (routePath === '/') return '1.0'
  return routePath.split('/').filter(Boolean).length > 1 ? '0.6' : '0.8'
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(route =>
    [
      '  <url>',
      `    <loc>${SITE_URL}${route.path}</loc>`,
      `    <lastmod>${buildDate}</lastmod>`,
      '    <changefreq>monthly</changefreq>',
      `    <priority>${priorityFor(route.path)}</priority>`,
      '  </url>',
    ].join('\n'),
  )
  .join('\n')}
</urlset>
`
writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap)
console.log('✓ sitemap.xml')

// vercel.json needs an explicit rewrite per route (source-controlled, so it
// can't be generated at build time) — this just catches drift if a route is
// added to seo-routes.json without updating it.
const vercelConfig = JSON.parse(readFileSync(path.join(rootDir, 'vercel.json'), 'utf-8'))
const rewriteSources = new Set(vercelConfig.rewrites.map(r => r.source))
const missing = routes.filter(r => r.path !== '/' && !rewriteSources.has(r.path))
if (missing.length > 0) {
  console.warn(
    `\n⚠ vercel.json is missing rewrites for: ${missing.map(r => r.path).join(', ')}\n` +
      '  Without them, sharing these URLs may show the homepage preview instead of their own.',
  )
}

console.log(`\nPrerendered SEO tags for ${routes.length} routes.`)
