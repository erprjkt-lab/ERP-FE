import type { FC } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const RequireAuth: FC = () => {
  const token = useAuthStore(state => state.token)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
