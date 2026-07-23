import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { buttonByText, iconButton, renderPage } from '@/test-utils/renderPage'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { CityList } from './CityList'

describe('CityList', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('renders cities with their resolved state name', () => {
    const state = useMastersStore.getState().createState({ name: 'Maharashtra', countryId: null })
    useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })
    renderPage(<CityList />)
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('Maharashtra')).toBeInTheDocument()
  })

  it('creates a city linked to a state via the modal', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createState({ name: 'Maharashtra', countryId: null })
    renderPage(<CityList />)

    await user.click(buttonByText('Add City'))
    await user.type(screen.getByLabelText('City Name'), 'Pune')
    await user.click(screen.getByLabelText('State'))
    await user.click(await screen.findByText('Maharashtra'))
    await user.click(buttonByText('OK'))

    await waitFor(() => expect(useMastersStore.getState().cities).toHaveLength(1))
    expect(useMastersStore.getState().cities[0]).toMatchObject({ name: 'Pune' })
  })

  it('deletes a city', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createCity({ name: 'Mumbai', stateId: null })
    renderPage(<CityList />)

    await user.click(iconButton('delete'))
    await user.click(buttonByText('Delete'))
    await waitFor(() => expect(useMastersStore.getState().cities).toHaveLength(0))
  })
})
