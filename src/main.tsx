import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Production builds ship each route's own dist/<route>/index.html with real
// prerendered markup already inside #root (see entry-server.tsx and
// scripts/prerender-seo.mjs) — hydrating onto it lets React reuse that DOM
// and just attach event listeners, instead of discarding it and rebuilding
// the whole tree from scratch, which is what makes the page interactive
// faster and avoids a visible re-render flash on load.
//
// The dev server's index.html has no prerendered content — #root starts
// empty — so hydrating there would just log a mismatch warning and fall back
// to a full client render anyway; skip straight to that instead.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
