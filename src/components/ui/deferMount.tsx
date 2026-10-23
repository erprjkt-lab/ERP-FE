import { useState } from 'react'
import type { FC } from 'react'

/**
 * Keeps a drawer/modal body unmounted until it is first opened, so the data
 * hooks inside it don't fire on the parent list page's initial render.
 * Once opened it stays mounted, so the close animation still runs.
 */
export function deferMount<P extends { open: boolean }>(Inner: FC<P>): FC<P> {
  const Deferred: FC<P> = props => {
    const [mounted, setMounted] = useState(props.open)
    if (props.open && !mounted) setMounted(true)
    return mounted || props.open ? <Inner {...props} /> : null
  }
  Deferred.displayName = `deferMount(${Inner.displayName ?? Inner.name})`
  return Deferred
}
