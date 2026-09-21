// Runs after `vite build` (client) and `vite build --ssr` (server bundle, see
// the `build:ssr` script). Generates a static dist/<route>/index.html per page
// with both that page's own <title>/description/OG/Twitter tags AND its
// actual rendered content baked in.
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
// mounts with createRoot (not hydrateRoot), so the browser replaces this
// markup with the live app on load — there's no hydration-mismatch risk here.
//
// Vercel/most static hosts serve an exact file match (dist/about/index.html)
// ahead of the SPA catch-all rewrite, so real users still get the normal
// client-rendered app once React Router takes over.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const distDir = path.join(rootDir, 'dist')
const ssrDir = path.join(rootDir, 'dist-ssr')
const routes = JSON.parse(readFileSync(path.join(rootDir, 'src/data/seo-routes.json'), 'utf-8'))
const SITE_URL = 'https://www.coreflowtech.in'

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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

for (const route of routes) {
  const url = `${SITE_URL}${route.path}`
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)

  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceTagContent(html, 'name', 'description', description)
  html = replaceTagContent(html, 'rel', 'canonical', url)
  html = replaceTagContent(html, 'property', 'og:title', title)
  html = replaceTagContent(html, 'property', 'og:description', description)
  html = replaceTagContent(html, 'property', 'og:url', url)
  html = replaceTagContent(html, 'name', 'twitter:title', title)
  html = replaceTagContent(html, 'name', 'twitter:description', description)

  const bodyHtml = render(route.path)
  if (!html.includes('<div id="root"></div>')) {
    throw new Error(`dist/index.html template is missing the expected empty <div id="root"></div>`)
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

  const outDir = route.path === '/' ? distDir : path.join(distDir, route.path)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'index.html'), html)
  console.log(`✓ ${route.path === '/' ? '/' : route.path + '/'}index.html`)
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
