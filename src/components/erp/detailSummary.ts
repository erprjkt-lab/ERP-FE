import type { DescriptionsProps } from 'antd'

/** Header strip on detail pages: small label above value, up to 6 per row, so
 * the general details fit in one or two short lines instead of a tall grid. */
export const SUMMARY_PROPS: DescriptionsProps = {
  className: 'erp-summary',
  size: 'small',
  layout: 'vertical',
  colon: false,
  column: { xs: 2, sm: 3, md: 4, lg: 6 },
}
