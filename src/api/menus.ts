import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiMenu, CreateMenuPayload, UpdateMenuPayload } from '@/types/api/rbac'

export function getSidebarMenu(): Promise<ApiEnvelope<ApiMenu[]>> {
  return apiRequest('/api/v1/menus/sidebar')
}

export function listMenus(page = 1): Promise<PaginatedEnvelope<ApiMenu>> {
  return apiRequest('/api/v1/menus', { query: { page, per_page: 100 } })
}

export function getMenu(id: number): Promise<ApiEnvelope<ApiMenu>> {
  return apiRequest(`/api/v1/menus/${id}`)
}

export function createMenu(payload: CreateMenuPayload): Promise<ApiEnvelope<ApiMenu>> {
  return apiRequest('/api/v1/menus', { method: 'POST', body: payload })
}

export function updateMenu(id: number, payload: UpdateMenuPayload): Promise<ApiEnvelope<ApiMenu>> {
  return apiRequest(`/api/v1/menus/${id}`, { method: 'PUT', body: payload })
}

export function deleteMenu(id: number): Promise<void> {
  return apiRequest(`/api/v1/menus/${id}`, { method: 'DELETE' })
}
