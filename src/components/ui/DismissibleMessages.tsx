import { App } from 'antd'
import { useEffect } from 'react'

/** True only where the device has a real pointer that can hover (desktop mouse). */
export const CAN_HOVER =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : false

/**
 * antd hardcodes `closable: false` on `message` (see antd/es/message/useMessage),
 * so a toast has no close button and no swipe — the only way to clear one early
 * is to destroy it from the API. This listens once, at the document level, and
 * clears the toasts when one is tapped or clicked.
 *
 * It destroys all current toasts rather than just the tapped one: antd puts no
 * key on the notice element, so there is nothing to identify an individual toast
 * from the DOM. With `maxCount` holding the stack to three that is the expected
 * behaviour anyway — you tap the stack away.
 *
 * Mounted inside `<App>` so it uses the same message instance as every
 * `App.useApp()` caller; the static `message` export is a different instance and
 * would not see, or be able to clear, their toasts.
 */
export function DismissibleMessages() {
  const { message } = App.useApp()

  useEffect(() => {
    const dismiss = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest?.('.ant-message-notice')) {
        message.destroy()
      }
    }

    // Capture phase: the notice re-renders as the stack animates, so waiting for
    // the event to bubble up from a node that may already be gone is unreliable.
    document.addEventListener('pointerdown', dismiss, true)
    return () => document.removeEventListener('pointerdown', dismiss, true)
  }, [message])

  return null
}
