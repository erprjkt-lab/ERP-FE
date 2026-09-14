// Runs after `vite build`. Generates a static dist/<route>/index.html per
// page with that page's own <title>/description/OG/Twitter tags baked in.
//
// Why: this is a client-side-only React SPA — social crawlers (WhatsApp,
// LinkedIn, Facebook, Slack, iMessage) fetch the raw HTML and read meta tags
// WITHOUT running JavaScript, so a hook that updates document.title after
// mount (see src/hooks/useSeo.ts) is invisible to them. Writing an actual
// static file per route is what makes sharing e.g. /services/erp-solutions
// show that page's own preview card instead of the homepage's.
//
// Vercel/most static hosts serve an exact file match (dist/about/index.html)
// ahead of the SPA catch-all rewrite, so real users still get the normal
// client-rendered app once React Router takes over.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const distDir = path.join(rootDir, 'dist')
const routes = JSON.parse(readFileSync(path.join(rootDir, 'src/data/seo-routes.json'), 'utf-8'))
const SITE_URL = 'https://coreflowtech.com'

const template = readFileSync(path.join(distDir, 'index.html'), 'utf-8')

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

  const outDir = route.path === '/' ? distDir : path.join(distDir, route.path)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'index.html'), html)
  console.log(`✓ ${route.path === '/' ? '/' : route.path + '/'}index.html`)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url><loc>${SITE_URL}${route.path}</loc></url>`).join('\n')}
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
