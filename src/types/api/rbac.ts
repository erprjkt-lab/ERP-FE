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
