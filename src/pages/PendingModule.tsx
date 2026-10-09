import type { FC } from 'react'
import { useParams } from 'react-router-dom'
import { useSidebarMenu } from '@/hooks/useMenus'
import { ComingSoon } from '@/pages/ComingSoon'
import type { ApiSidebarNode } from '@/types/api/rbac'

function findName(nodes: ApiSidebarNode[], moduleKey: string): string | undefined {
  for (const node of nodes) {
    if (node.module_key === moduleKey) return node.name
    const found = findName(node.children, moduleKey)
    if (found) return found
  }
  return undefined
}

/**
 * Landing page for a BE menu module this app has no screen for yet. Titled from the
 * sidebar tree so it reads the same as the menu entry the user clicked.
 */
export const PendingModule: FC = () => {
  const { moduleKey = '' } = useParams()
  const { data: sidebarTree } = useSidebarMenu()

  return <ComingSoon title={findName(sidebarTree ?? [], moduleKey) ?? 'Module'} />
}
