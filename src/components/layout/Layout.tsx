import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { useSeo } from '@/hooks/useSeo'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function Layout() {
  const { pathname } = useLocation()
  useSeo()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
