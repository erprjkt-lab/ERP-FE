export interface ApiMenu {
  id: number
  parent_id: number | null
  name: string
  icon: string | null
  route: string | null
  permission_name: string | null
  sequence: number
  is_active: boolean
  created_at?: string
  created_by?: number | null
  updated_by?: number | null
}

// One node of GET /menus/sidebar: the logged-in user's permission-filtered menu tree.
// Folder nodes have no module_key; module nodes only appear when can.read is true
// (or when a descendant is visible).
export interface ApiSidebarNode {
  id: number
  name: string
  icon: string | null
  route: string | null
  module_key: string | null
  sequence: number
  can: { read: boolean; write: boolean; modify: boolean; delete: boolean; approve: boolean }
  children: ApiSidebarNode[]
}

// One node of GET /employees/{employee}/menus: the whole menu tree (nothing hidden),
// each module node annotated with what that employee currently holds.
export interface ApiEmployeeMenuNode {
  id: number
  name: string
  icon: string | null
  route: string | null
  module_key: string | null
  available_actions: string[]
  granted_actions: string[]
  sequence: number
  is_active: boolean
  children: ApiEmployeeMenuNode[]
}

export interface GrantMenuPermissionsBulkPayload {
  menus: { menu_id: number; actions: string[] }[]
}

export interface CreateMenuPayload {
  parent_id?: number | null
  name: string
  icon?: string
  route?: string
  permission_name?: string
  sequence?: number
  is_active?: boolean
}

export type UpdateMenuPayload = Partial<CreateMenuPayload>

export interface ApiRole {
  id: number
  name: string
  guard_name: string
  permissions?: string[]
  created_at?: string
}

export interface CreateRolePayload {
  name: string
  permissions?: string[]
}

export interface UpdateRolePayload {
  name: string
}

export interface SyncRolePermissionsPayload {
  permissions: string[]
}

export interface ApiPermission {
  id: number
  name: string
  guard_name: string
  created_at?: string
}

export interface CreatePermissionPayload {
  name: string
}
