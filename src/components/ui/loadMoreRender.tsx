import { Button, Divider } from 'antd'
import type { ReactNode } from 'react'

/** A "Load more" footer for a Select whose lookup returned only its first page.
 *
 *  Pass the result as the Select's `popupRender`. Returns undefined when there
 *  is nothing more to fetch, so the dropdown renders exactly as it did before.
 *  Pair with useLookupPaging, which owns the page size and the hasMore test.
 */
export function loadMoreRender(hasMore: boolean, onLoadMore: () => void, loading = false) {
  if (!hasMore) return undefined

  return (menu: ReactNode) => (
    <>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <Button
        type="link"
        block
        size="small"
        loading={loading}
        // Keeps the dropdown open: Select closes on blur, and mousedown is what
        // takes focus away from it.
        onMouseDown={event => event.preventDefault()}
        onClick={onLoadMore}
      >
        Load more
      </Button>
    </>
  )
}
