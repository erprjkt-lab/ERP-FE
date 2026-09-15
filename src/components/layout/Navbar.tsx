import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, Phone, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { COMPANY, NAV_ITEMS } from '@/data/site'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setServicesOpen(false)
  }, [location.pathname])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 shadow-sm backdrop-blur-lg' : 'bg-transparent'
      }`}
    >
      <motion.nav
        animate={{ paddingTop: scrolled ? 10 : 16, paddingBottom: scrolled ? 10 : 16 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8"
      >
        <Link to="/">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Logo />
          </motion.div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map(item =>
            item.children ? (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-600">
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <AnimatePresence>
                  {servicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full w-72 pt-3"
                    >
                      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white p-2 shadow-card">
                        {item.children.map(child => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="block rounded-xl px-4 py-3 transition-colors hover:bg-brand-50"
                          >
                            <div className="text-sm font-semibold text-ink-900">{child.label}</div>
                            <div className="mt-0.5 text-xs text-ink-500">{child.description}</div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative isolate rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-brand-600 ${
                    isActive ? 'text-brand-600' : 'text-ink-700 hover:bg-ink-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-brand-50"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    {item.label}
                  </>
                )}
              </NavLink>
            ),
          )}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={`tel:${COMPANY.phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 transition-colors hover:text-brand-600"
          >
            <Phone className="h-3.5 w-3.5" />
            {COMPANY.phone}
          </a>
          <Button to="/contact" variant="primary" className="!px-5 !py-2.5 text-xs">
            Get a Quote
          </Button>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-2 text-ink-700 lg:hidden"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="block"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-ink-100 bg-white lg:hidden"
          >
            <motion.div
              className="space-y-1 px-6 py-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } }}
            >
              {NAV_ITEMS.map(item => (
                <motion.div
                  key={item.path}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                  }}
                >
                  <Link
                    to={item.path}
                    className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:text-brand-600"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-3 space-y-1 border-l border-ink-100 pl-3">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block rounded-lg px-3 py-2 text-sm text-ink-500 transition-colors hover:text-brand-600"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <motion.div
                className="pt-2"
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                }}
              >
                <Button to="/contact" variant="primary" className="w-full justify-center">
                  Get a Quote
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
