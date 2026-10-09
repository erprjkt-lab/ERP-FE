import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiDashboardWidgets } from '@/types/api/dashboard'

export function getDashboard(): Promise<ApiEnvelope<{ widgets: ApiDashboardWidgets }>> {
  return apiRequest('/api/v1/dashboard')
}
