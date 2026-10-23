import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/api/auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
  isLoggedOut: boolean
  setToken: (token: string) => void
  setUser: (user: AuthUser | null) => void
  clear: () => void
  validateToken: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedOut: false,
      setToken: token => set({ token, isLoggedOut: false }),
      setUser: user => set({ user }),
      clear: () => set({ token: null, user: null, isLoggedOut: true }),
      validateToken: () => {
        // Reads through `get` rather than useAuthStore.getState(): referring to the
        // store inside its own initializer makes its type circular, which silently
        // degrades every `useAuthStore(state => ...)` selector in the app to `any`.
        const { token } = get()
        return typeof token === 'string' && token.length > 10
      },
    }),
    {
      name: 'erp-auth',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate auth store:', error)
        }
        // Reset logout flag on app load
        if (state) {
          state.isLoggedOut = false
        }
      },
    },
  ),
)
