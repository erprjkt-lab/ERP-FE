import { useAuthStore } from '@/store/authStore'

export function useCurrentUserName(): string {
  return useAuthStore(s => s.user?.name) ?? 'Unknown User'
}
