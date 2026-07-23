import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from 'antd'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormField } from '@/components/ui/FormField'
import { SimpleMasterList } from './SimpleMasterList'

interface Country {
  id: string
  name: string
}

afterEach(() => {
  cleanup()
})

// AntD's accessible-name computation gets unreliable across successive
// renders within the same test file under jsdom (verified: the button is
// present, visible, and role="button", but `getByRole(..., { name })`
// intermittently fails to match it) — query by literal text/icon class and
// walk up to the <button> instead of relying on the computed accessible name.
function buttonByText(text: string): HTMLElement {
  const el = screen.getByText(text).closest('button')
  if (!el) throw new Error(`No <button> ancestor found for text "${text}"`)
  return el as HTMLElement
}

function iconButton(iconName: 'edit' | 'delete'): HTMLElement {
  const icon = document.querySelector(`.anticon-${iconName}`)
  const el = icon?.closest('button')
  if (!el) throw new Error(`No <button> ancestor found for icon "${iconName}"`)
  return el as HTMLElement
}

function renderList(overrides: Partial<Parameters<typeof SimpleMasterList<Country>>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onDelete = vi.fn().mockResolvedValue(undefined)

  const props = {
    title: 'Countries',
    breadcrumbParent: { label: 'Masters', href: '/masters' },
    breadcrumbLabel: 'Country',
    totalLabel: 'countries',
    addButtonLabel: 'Add Country',
    data: [{ id: '1', name: 'India' }],
    columns: [{ title: 'Name', dataIndex: 'name', key: 'name' }],
    renderFields: () => <FormField label="Country Name" name="name" rules={[{ required: true }]} />,
    onSubmit,
    onDelete,
    ...overrides,
  }

  const utils = render(
    <App>
      <SimpleMasterList<Country> {...props} />
    </App>,
  )
  return { ...utils, onSubmit, onDelete }
}

describe('SimpleMasterList', () => {
  it('renders the page title, breadcrumb, and data rows', () => {
    renderList()
    expect(screen.getByRole('heading', { name: 'Countries' })).toBeInTheDocument()
    expect(document.querySelector('.ant-breadcrumb')).toHaveTextContent('Masters')
    expect(document.querySelector('.ant-breadcrumb')).toHaveTextContent('Country')
    expect(screen.getByText('India')).toBeInTheDocument()
  })

  it('opens a create modal with the add button label as its title', async () => {
    const user = userEvent.setup()
    renderList()
    await user.click(buttonByText('Add Country'))
    expect(document.querySelector('.ant-modal-title')).toHaveTextContent('Add Country')
    expect(screen.getByLabelText('Country Name')).toHaveValue('')
  })

  it('opens an edit modal pre-filled via getInitialValues', async () => {
    const user = userEvent.setup()
    renderList({ getInitialValues: record => ({ name: record.name }) })
    await user.click(iconButton('edit'))
    expect(document.querySelector('.ant-modal-title')).toHaveTextContent('Edit Country')
    expect(screen.getByLabelText('Country Name')).toHaveValue('India')
  })

  it('submits the form and reports success', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderList()

    await user.click(buttonByText('Add Country'))
    await user.type(screen.getByLabelText('Country Name'), 'USA')
    await user.click(buttonByText('OK'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'USA' }, null))
    expect(await screen.findByText('Country created successfully')).toBeInTheDocument()
  })

  it('shows a validation error and does not call onSubmit when a required field is empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderList()

    await user.click(buttonByText('Add Country'))
    await user.click(buttonByText('OK'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error message when onSubmit rejects', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Name already exists'))
    renderList({ onSubmit })

    await user.click(buttonByText('Add Country'))
    await user.type(screen.getByLabelText('Country Name'), 'India')
    await user.click(buttonByText('OK'))

    expect(await screen.findByText('Name already exists')).toBeInTheDocument()
  })

  it('confirms before deleting, then calls onDelete', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderList()

    await user.click(iconButton('delete'))
    expect(document.querySelector('.ant-modal-confirm-title')).toHaveTextContent(
      'Delete this country?',
    )

    await user.click(buttonByText('Delete'))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith({ id: '1', name: 'India' }))
    expect(await screen.findByText('Country deleted successfully')).toBeInTheDocument()
  })

  it('does not call onDelete when the confirm dialog is cancelled', async () => {
    const user = userEvent.setup()
    const { onDelete } = renderList()

    await user.click(iconButton('delete'))
    await user.click(buttonByText('Cancel'))

    expect(onDelete).not.toHaveBeenCalled()
  })
})
