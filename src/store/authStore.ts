import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/api/auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
  setToken: (token: string) => void
  setUser: (user: AuthUser | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      setToken: token => set({ token }),
      setUser: user => set({ user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'erp-auth' },
  ),
)
