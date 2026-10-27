import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApiRequestError } from '@/api/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

// Master/reference data behind the app's dropdowns — items, parties, HR
// lookups, locations, processes. It changes rarely and is never touched by a
// transactional save, so it does not belong on the 10s transactional cadence:
// left there, every unrelated save marked it stale and it refetched on the
// next navigation, which was most of the "why is it calling this again" churn.
// Its own master edit still refreshes it — those mutation hooks invalidate
// their own list directly, independent of the blanket below.
const MASTER_KEY_ROOTS = new Set([
  'masters',
  'finishedGoods',
  'rawMaterials',
  'consumables',
  'suppliers',
  'customers',
  'vendors',
  'departments',
  'designations',
  'shifts',
  'employees',
  'locations',
  'gaugeInstruments',
  'machines',
  'packingMaterials',
])

function isMasterData(key: readonly unknown[]): boolean {
  if (key[0] === 'world') return true
  if (typeof key[0] === 'string' && MASTER_KEY_ROOTS.has(key[0])) return true
  // ['production', ...] is mostly transactional (job cards); only the process
  // master under it is reference data.
  return key[0] === 'production' && key[1] === 'processes'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Only retry what a retry can fix. A 4xx is deterministic, and retrying
      // a rate limit doubles the burst that caused it; the api client already
      // parks the whole app on a 429.
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiRequestError && error.status < 500),
      // This is a multi-user ERP: a list must show what the server has when you
      // navigate back to it, not a five-minute-old copy of someone else's data.
      // Ten seconds is short enough that switching tabs and coming back shows
      // the change someone else just made, and long enough that flicking
      // between two screens serves cache instead of re-fetching. This is the
      // cadence for transactional data; master/reference data is given a
      // longer window below (see MASTER_KEY_ROOTS).
      // A write of your own never waits for this: every mutation marks the
      // cache invalidated, and an invalidated query re-fetches on its next
      // mount however fresh this would otherwise call it.
      staleTime: 10_000,
      // The hosted backend sits behind Hostinger's WAF, which hard-blocks a
      // burst of ~50 requests from one IP with a plain HTML 403 (no CORS
      // headers, so the browser reports it as a CORS error). Refetching every
      // mounted query on every window focus was reliably tripping it.
      refetchOnWindowFocus: false,
    },
  },
  // Any successful mutation marks every query stale, so a write in one module
  // shows up in another without each hook having to know who depends on it
  // (a delivery challan moves stock, a GRN moves stock and the PO, ...).
  // refetchType 'none' means marked and not refired: a hub page like the job
  // card has a dozen mounted queries, and refetching all of them after every
  // save was a 15-20 request burst where the mutation's own hook already
  // refetches the few lists that actually moved. Everything else reloads on
  // its next mount.
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        // A transactional write never changes master data, so leave those
        // caches alone — invalidating them here is what made every dropdown
        // refetch on the next page after any save.
        predicate: query => !isMasterData(query.queryKey),
        refetchType: 'none',
      })
    },
  }),
})

// Five minutes: a dropdown does not need another user's new UOM within 10s,
// and this is what stops master lists refetching as you move between forms.
for (const root of MASTER_KEY_ROOTS) {
  queryClient.setQueryDefaults([root], { staleTime: 5 * 60_000 })
}
queryClient.setQueryDefaults(['production', 'processes'], { staleTime: 5 * 60_000 })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
