import { StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'

// Used only by scripts/prerender-seo.mjs at build time, via the SSR bundle
// built from this file — never shipped to the browser. Renders each route to
// plain HTML so crawlers that don't execute JavaScript (GPTBot, ClaudeBot,
// PerplexityBot, and others) have real text to read, not an empty <div
// id="root">. Real visitors still get the normal client-rendered app: main.tsx
// mounts with createRoot (not hydrateRoot), so the browser replaces this
// markup with the live app on load rather than hydrating onto it — there's no
// hydration-mismatch risk to manage.
export function render(url: string): string {
  return renderToStaticMarkup(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
}
