import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  it('renders its content and title when open', () => {
    render(
      <Drawer open title="Edit Item">
        <p>Drawer body</p>
      </Drawer>,
    )
    expect(screen.getByText('Edit Item')).toBeInTheDocument()
    expect(screen.getByText('Drawer body')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <Drawer open={false} title="Edit Item">
        <p>Drawer body</p>
      </Drawer>,
    )
    expect(screen.queryByText('Drawer body')).not.toBeInTheDocument()
  })

  it('defaults to a width of 480', () => {
    render(
      <Drawer open title="Edit Item">
        content
      </Drawer>,
    )
    const panel = document.querySelector('.ant-drawer-content-wrapper') as HTMLElement
    expect(panel.style.width).toBe('480px')
  })

  it('accepts a custom width override', () => {
    render(
      <Drawer open title="Edit Item" width={640}>
        content
      </Drawer>,
    )
    const panel = document.querySelector('.ant-drawer-content-wrapper') as HTMLElement
    expect(panel.style.width).toBe('640px')
  })
})
