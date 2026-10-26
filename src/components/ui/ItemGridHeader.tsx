import { theme } from 'antd'
import type { FC, ReactNode } from 'react'

export interface ItemGridHeaderProps {
  /** The same grid-template-columns the rows below use, so they line up. */
  template: string
  /** One per column, in order. Empty string for a column with no heading,
   *  such as the trailing delete button. */
  labels: ReactNode[]
}

/**
 * Column headings for a Form.List laid out as a grid of inline fields. Without
 * them a row of placeholders leaves the reader guessing — two unlabelled
 * numeric boxes showing "0" could be anything.
 */
export const ItemGridHeader: FC<ItemGridHeaderProps> = ({ template, labels }) => {
  const { token } = theme.useToken()

  return (
    <div
      className="erp-item-grid-header"
      style={{
        display: 'grid',
        gridTemplateColumns: template,
        gap: '0 8px',
        fontSize: 12,
        color: token.colorTextTertiary,
        marginBottom: 4,
      }}
    >
      {labels.map((label, index) => (
        <div key={index}>{label}</div>
      ))}
    </div>
  )
}
