import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { buttonByText, iconButton, renderPage } from '@/test-utils/renderPage'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { StateList } from './StateList'

describe('StateList', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('renders states with their resolved country name', () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    useMastersStore.getState().createState({ name: 'Maharashtra', countryId: country.id })
    renderPage(<StateList />)
    expect(screen.getByText('Maharashtra')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
  })

  it('creates a state linked to a country via the modal', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createCountry({ name: 'India' })
    renderPage(<StateList />)

    await user.click(buttonByText('Add State'))
    await user.type(screen.getByLabelText('State Name'), 'Gujarat')
    await user.click(screen.getByLabelText('Country'))
    await user.click(await screen.findByText('India'))
    await user.click(buttonByText('OK'))

    await waitFor(() => expect(useMastersStore.getState().states).toHaveLength(1))
    expect(useMastersStore.getState().states[0]).toMatchObject({ name: 'Gujarat' })
  })

  it('deletes a state', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createState({ name: 'Maharashtra', countryId: null })
    renderPage(<StateList />)

    await user.click(iconButton('delete'))
    await user.click(buttonByText('Delete'))
    await waitFor(() => expect(useMastersStore.getState().states).toHaveLength(0))
  })
})
