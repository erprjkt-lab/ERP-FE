import type { ApiEmployeeMenuNode } from '@/types/api/rbac'

/** The five actions ERP-BE's MenuAction enum defines, in the order we show them. */
export const MENU_ACTIONS = ['read', 'write', 'modify', 'delete', 'approve'] as const

export type MenuAction = (typeof MENU_ACTIONS)[number]

export interface MenuPermissionRow {
  key: number
  name: string
  /** Empty on folder nodes — they group other menus and carry no permissions. */
  availableActions: string[]
  grantedActions: string[]
  children?: MenuPermissionRow[]
}

export function toPermissionRows(nodes: ApiEmployeeMenuNode[]): MenuPermissionRow[] {
  return [...nodes]
    .sort((a, b) => a.sequence - b.sequence)
    .map(node => ({
      key: node.id,
      name: node.name,
      availableActions: node.available_actions ?? [],
      grantedActions: node.granted_actions ?? [],
      ...(node.children.length > 0 ? { children: toPermissionRows(node.children) } : {}),
    }))
}

export function flattenRows(rows: MenuPermissionRow[]): MenuPermissionRow[] {
  return rows.flatMap(row => [row, ...flattenRows(row.children ?? [])])
}

const sameActions = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join()

/**
 * Only the menus whose action set the user actually changed, as the bulk-save payload
 * expects them. Sending the untouched ones would be harmless (the BE diffs too) but
 * would also re-save grants nobody edited.
 */
export function changedMenus(
  rows: MenuPermissionRow[],
  edits: Record<number, string[]>,
): { menu_id: number; actions: string[] }[] {
  return flattenRows(rows)
    .filter(row => edits[row.key] && !sameActions(edits[row.key], row.grantedActions))
    .map(row => ({ menu_id: row.key, actions: edits[row.key] }))
}

/** Self plus descendants, keeping only the nodes that actually carry permissions. */
export function permissionBearingRows(row: MenuPermissionRow): MenuPermissionRow[] {
  return flattenRows([row]).filter(node => node.availableActions.length > 0)
}

/**
 * How many of the available action slots across these rows are currently ticked —
 * what the "select everything here" checkboxes use to decide checked/indeterminate.
 */
export function selectionSummary(
  rows: MenuPermissionRow[],
  edits: Record<number, string[]>,
): { selected: number; total: number } {
  let selected = 0
  let total = 0

  for (const row of rows) {
    const current = edits[row.key] ?? row.grantedActions
    total += row.availableActions.length
    selected += row.availableActions.filter(action => current.includes(action)).length
  }

  return { selected, total }
}
