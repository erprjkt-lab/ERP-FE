import type { CSSProperties } from 'react'

export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
export const FONT_DISPLAY = "'Space Grotesk', 'Inter', -apple-system, sans-serif"

/** Ledger face — codes, IDs, quantities, amounts, anything meant to line up
 * in a column. This is the app's one typographic signature; use it for data,
 * never for prose. */
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace"

export const tabularNums: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
}

export const ledgerText: CSSProperties = {
  fontFamily: FONT_MONO,
  fontVariantNumeric: 'tabular-nums',
}
