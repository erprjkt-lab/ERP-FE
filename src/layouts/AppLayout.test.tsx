import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
import { useAuthStore } from '@/store/authStore'

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  me: vi.fn(),
  logout: vi.fn(),
}))

import { logout } from '@/api/auth'
import { AppLayout } from './AppLayout'

describe('AppLayout — user menu logout', () => {
  beforeEach(() => {
    vi.mocked(logout).mockReset()
    useAuthStore.setState({ token: 'test-token', user: null })
  })

  it('calls the logout API and clears the auth token when Logout is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(logout).mockResolvedValue(undefined)

    renderPage(<AppLayout />)

    await user.click(screen.getByText('Admin'))
    await user.click(await screen.findByText('Logout'))

    await waitFor(() => expect(logout).toHaveBeenCalled())
    await waitFor(() => expect(useAuthStore.getState().token).toBeNull())
  })

  it('still clears the local session when the logout API call fails', async () => {
    const user = userEvent.setup()
    vi.mocked(logout).mockRejectedValue(new Error('network error'))

    renderPage(<AppLayout />)

    await user.click(screen.getByText('Admin'))
    await user.click(await screen.findByText('Logout'))

    await waitFor(() => expect(useAuthStore.getState().token).toBeNull())
  })
})
