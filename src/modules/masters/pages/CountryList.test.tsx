import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { buttonByText, iconButton, renderPage } from '@/test-utils/renderPage'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { CountryList } from './CountryList'

describe('CountryList', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('renders seeded countries from the store', () => {
    useMastersStore.getState().createCountry({ name: 'India' })
    renderPage(<CountryList />)
    expect(screen.getByText('India')).toBeInTheDocument()
  })

  it('creates a country through the modal and shows it in the list', async () => {
    const user = userEvent.setup()
    renderPage(<CountryList />)

    await user.click(buttonByText('Add Country'))
    await user.type(screen.getByLabelText('Country Name'), 'USA')
    await user.click(buttonByText('OK'))

    await waitFor(() => expect(useMastersStore.getState().countries).toHaveLength(1))
    expect(useMastersStore.getState().countries[0].name).toBe('USA')
    expect(await screen.findByText('USA')).toBeInTheDocument()
  })

  it('edits and deletes a country', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createCountry({ name: 'India' })
    renderPage(<CountryList />)

    await user.click(iconButton('edit'))
    const input = screen.getByLabelText('Country Name')
    await user.clear(input)
    await user.type(input, 'Bharat')
    await user.click(buttonByText('OK'))
    await waitFor(() => expect(useMastersStore.getState().countries[0].name).toBe('Bharat'))

    await user.click(iconButton('delete'))
    await user.click(buttonByText('Delete'))
    await waitFor(() => expect(useMastersStore.getState().countries).toHaveLength(0))
  })
})
