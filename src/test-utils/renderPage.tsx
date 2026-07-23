import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { App as AntApp } from 'antd'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

export function renderPage(
  ui: ReactElement,
  { path = '/', initialEntries = ['/'] }: { path?: string; initialEntries?: string[] } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

// AntD's accessible-name computation is unreliable across successive renders
// within the same test file under jsdom — query by literal text/icon class
// and walk up to the <button> instead of relying on the computed name.
export function buttonByText(text: string): HTMLElement {
  const el = screen.getByText(text).closest('button')
  if (!el) throw new Error(`No <button> ancestor found for text "${text}"`)
  return el as HTMLElement
}

export function iconButton(iconName: string): HTMLElement {
  const icon = document.querySelector(`.anticon-${iconName}`)
  const el = icon?.closest('button')
  if (!el) throw new Error(`No <button> ancestor found for icon "${iconName}"`)
  return el as HTMLElement
}
