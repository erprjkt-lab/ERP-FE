import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

const ThrowsOnRender = () => {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  describe('when a child throws during render', () => {
    // React logs the error to console itself even though the boundary catches
    // it — silence that expected noise for just these assertions.
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it('shows the fallback instead of letting the error propagate', () => {
      render(
        <ErrorBoundary>
          <ThrowsOnRender />
        </ErrorBoundary>,
      )
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('boom')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument()
    })
  })
})
