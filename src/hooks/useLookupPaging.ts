import { useCallback, useState } from 'react'

/** Grows a lookup's page size on demand, for dropdowns fed by an endpoint that
 *  returns only the first page.
 *
 *  It widens `per_page` rather than accumulating pages: ERP-BE has no `search`
 *  on these endpoints, so the dropdown matches text against the options it
 *  holds — options have to be in one list for that to work, and re-fetching a
 *  wider page keeps them in one list without any client-side merging. Swap this
 *  for a server-side search once those endpoints accept a term.
 */
export function useLookupPaging(step = 100) {
  const [perPage, setPerPage] = useState(step)
  const loadMore = useCallback(() => setPerPage(size => size + step), [step])

  return {
    perPage,
    loadMore,
    /** True while the endpoint reports more rows than were fetched. */
    hasMore: (total: number | undefined) => (total ?? 0) > perPage,
  }
}
