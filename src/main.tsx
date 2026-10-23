import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApiRequestError } from '@/api/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

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
      // between two screens serves cache instead of re-fetching. Masters
      // (uoms, item categories, material grades, locations) inherit it; only
      // geography pins Infinity, being immutable and huge.
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
        // Geography is immutable and city lists are numerous — refetching them
        // after every save just burns WAF budget.
        predicate: query => query.queryKey[0] !== 'world',
        refetchType: 'none',
      })
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
