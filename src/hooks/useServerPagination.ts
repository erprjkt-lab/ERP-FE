import { useState } from 'react'

/** Page state for a list whose rows come back one page at a time from ERP-BE.
 *
 * Page size defaults to 100 rather than the table's usual 20: several of these
 * endpoints have no `search` on ERP-BE yet, so their pages still match text
 * against the rows they hold. A large page keeps that match as wide as it was
 * before paging existed, while rows past the first hundred finally become
 * reachable. Drop the default to 20 once those endpoints accept a search term.
 */
export function useServerPagination(defaultPageSize = 100) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  return {
    page,
    pageSize,
    setPage,
    /** Spread onto DataTable's `pagination`, passing the envelope's meta.total. */
    paginationProps: (total: number | undefined) => ({
      current: page,
      pageSize,
      total: total ?? 0,
      pageSizeOptions: [20, 50, 100, 200],
      onChange: (nextPage: number, nextPageSize: number) => {
        setPage(nextPage)
        setPageSize(nextPageSize)
      },
    }),
  }
}
