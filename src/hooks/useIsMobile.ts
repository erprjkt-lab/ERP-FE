import { useSyncExternalStore } from 'react'

/** Below Ant Design's `md` breakpoint (768px). Kept as a shared constant so the
 * JS switch and any CSS that mirrors it can never drift apart — a mismatch of
 * even 0.02px leaves a viewport width where neither layout renders. */
export const MOBILE_MEDIA_QUERY = '(max-width: 767.98px)'

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

// Module-scope so the identities stay stable across renders, otherwise
// useSyncExternalStore resubscribes on every render.
function subscribe(onStoreChange: () => void): () => void {
  if (!hasMatchMedia()) return () => {}
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot(): boolean {
  if (!hasMatchMedia()) return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/** True on phone-sized viewports, read synchronously on the very first render.
 *
 * Deliberately not `Grid.useBreakpoint()`: antd resolves its breakpoints in a
 * layout effect, so its first render reports `md: undefined`, which would flash
 * the mobile layout to desktop users for a frame. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
