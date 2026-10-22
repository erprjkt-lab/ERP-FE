import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60_000,
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
  // Only currently-mounted queries refetch; everything else reloads on its
  // next mount, so this costs far less than it looks.
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        // Geography is immutable and city lists are numerous — refetching them
        // after every save just burns WAF budget.
        predicate: query => query.queryKey[0] !== 'world',
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
