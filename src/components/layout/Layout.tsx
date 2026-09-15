import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
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
      {/* Enter-only transition — deliberately no exit animation/AnimatePresence.
          An exit animation would need AnimatePresence to hold the outgoing page
          mounted until it resolves, and mobile browsers can throttle rAF during
          the address-bar transition that happens on navigation, so that
          resolution can simply never fire — leaving the page blank until a
          manual refresh. Keying by pathname still gets a fresh mount + fade/rise
          on every route change with none of that risk. */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
