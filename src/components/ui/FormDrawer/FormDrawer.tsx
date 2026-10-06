import { Space } from 'antd'
import type { FC, MouseEventHandler, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import type { DrawerProps } from '@/components/ui/Drawer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'

export interface FormDrawerProps extends Omit<DrawerProps, 'footer'> {
  /** Shown as a tag next to the title — e.g. the record's current workflow status. */
  status?: StatusBadgeStatus
  statusLabel?: string
  onSubmit?: MouseEventHandler<HTMLElement>
  onCancel?: MouseEventHandler<HTMLElement>
  submitText?: string
  cancelText?: string
  /** Puts the submit button in a loading state and disables it. */
  submitting?: boolean
  submitDisabled?: boolean
  /** Hide the Cancel/Submit footer entirely — for a read-only side panel. */
  hideFooter?: boolean
  /** Extra actions rendered to the left of Cancel/Submit (e.g. a Delete button). */
  extraFooter?: ReactNode
}

// Drawer pre-wired for "long form that doesn't deserve its own page": title +
// optional status tag, Cancel/Submit footer, scrollable body. Compose the body
// out of Form + FormField/FormSection like you would inside Modal.
export const FormDrawer: FC<FormDrawerProps> = ({
  title,
  status,
  statusLabel,
  onSubmit,
  onCancel,
  onClose,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitting = false,
  submitDisabled = false,
  hideFooter = false,
  extraFooter,
  children,
  ...props
}) => {
  return (
    <Drawer
      title={
        status ? (
          <Space>
            <span>{title}</span>
            <StatusBadge status={status} label={statusLabel} />
          </Space>
        ) : (
          title
        )
      }
      onClose={onClose}
      footer={
        hideFooter ? null : (
          <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            {extraFooter}
            <Button onClick={onCancel ?? (onClose as MouseEventHandler<HTMLElement>)}>
              {cancelText}
            </Button>
            <Button
              type="primary"
              loading={submitting}
              disabled={submitDisabled}
              onClick={onSubmit}
            >
              {submitText}
            </Button>
          </Space>
        )
      }
      {...props}
    >
      {children}
    </Drawer>
  )
}
