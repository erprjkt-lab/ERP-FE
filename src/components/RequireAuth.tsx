import { App } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export const RequireAuth: FC = () => {
  const token = useAuthStore(state => state.token)
  const isLoggedOut = useAuthStore(state => state.isLoggedOut)
  const { message } = App.useApp()

  useEffect(() => {
    if (isLoggedOut && !token) {
      message.warning('Your session has expired. Please log in again.', 5)
    }
  }, [isLoggedOut, token, message])

  return token ? <Outlet /> : <Navigate to="/login" replace />
}
