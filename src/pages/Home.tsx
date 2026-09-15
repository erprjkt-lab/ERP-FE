import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  Boxes,
  Factory,
  Globe2,
  HeartPulse,
  Cpu,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Store,
  Users2,
  Workflow,
  Wallet,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedText } from '@/components/ui/AnimatedText'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { Parallax } from '@/components/ui/Parallax'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Marquee } from '@/components/ui/Marquee'
import { SectionWave } from '@/components/ui/SectionWave'
import { AmbientDots } from '@/components/ui/AmbientDots'
import { StatsBar } from '@/components/sections/StatsBar'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { ERP_MODULES, INDUSTRIES, MARQUEE_ITEMS, PRODUCTS } from '@/data/site'

const SERVICE_CARDS = [
  {
    icon: Workflow,
    title: 'ERP Solutions',
    description:
      'A single connected system for HR, finance, inventory, production, procurement and sales.',
    to: '/services/erp-solutions',
  },
  {
    icon: Globe2,
    title: 'Web Development',
    description: 'Fast, modern websites and web platforms built to represent your business well.',
    to: '/services/web-development',
  },
]

const MODULE_ICONS: Record<string, typeof Users2> = {
  hr: Users2,
  finance: Wallet,
  inventory: Boxes,
  production: Factory,
  procurement: ClipboardList,
  sales: ShoppingCart,
}

const INDUSTRY_ICONS: Record<string, typeof ShieldCheck> = {
  engineering: Factory,
  medicine: HeartPulse,
  tech: Cpu,
  retail: Store,
  logistics: Truck,
  trading: Boxes,
}

function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const sxInverse = useTransform(sx, v => v * -1.4)
  const syInverse = useTransform(sy, v => v * -1.4)
  const blob1 = useMotionTemplate`translate3d(${sx}px, ${sy}px, 0)`
  const blob2 = useMotionTemplate`translate3d(${sxInverse}px, ${syInverse}px, 0)`

  const rotateY = useTransform(sx, [-20, 20], [-5, 5])
  const rotateX = useTransform(sy, [-20, 20], [5, -5])

  // Cycles the highlighted module every few seconds so the panel feels
  // alive without inventing metrics we don't actually have; hovering a
  // tile takes over and pauses the auto-cycle until the cursor leaves.
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setActive(current => (current + 1) % ERP_MODULES.length)
    }, 2600)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <div
      ref={ref}
      onMouseMove={e => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 40)
        my.set(((e.clientY - rect.top) / rect.height - 0.5) * 40)
      }}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      className="relative"
    >
      {/* Mouse-parallax wrappers: the CSS drift animation lives on the inner
          element so it doesn't fight the motion-value transform on this one. */}
      <motion.div style={{ transform: blob1 }} className="absolute -left-24 top-24 h-72 w-72" aria-hidden>
        <div className="h-full w-full animate-drift-a rounded-full bg-brand-200/40 blur-3xl" />
      </motion.div>
      <motion.div style={{ transform: blob2 }} className="absolute -right-16 top-64 h-80 w-80" aria-hidden>
        <div className="h-full w-full animate-drift-b rounded-full bg-violet-200/40 blur-3xl" />
      </motion.div>

      {/* Purely ambient — always drifting, independent of the cursor. The
          parallax wrappers add a second, scroll-driven layer of depth. */}
      <Parallax speed={0.35} className="absolute left-1/3 -top-10">
        <div
          className="h-56 w-56 animate-drift-c animate-blob-morph bg-brand-300/25 blur-3xl"
          aria-hidden
        />
      </Parallax>
      <Parallax speed={-0.25} className="absolute -bottom-16 right-1/4">
        <div
          className="h-64 w-64 animate-drift-a animate-blob-morph bg-violet-300/25 blur-3xl [animation-delay:-6s]"
          aria-hidden
        />
      </Parallax>

      <Reveal delay={0.4} className="relative mt-20">
        <div className="relative mx-auto max-w-5xl rounded-3xl border border-ink-100 bg-white/70 p-3 shadow-card backdrop-blur">
          <motion.div
            style={{ rotateX, rotateY, transformPerspective: 1200 }}
            className="rounded-2xl bg-ink-950 p-6 sm:p-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                <span className="text-xs font-semibold text-white/70">One connected system</span>
              </div>
              <span className="hidden text-xs text-ink-500 sm:block">
                {ERP_MODULES.length} modules, always in sync
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {ERP_MODULES.map((module, i) => {
                const Icon = MODULE_ICONS[module.key] ?? Users2
                const isActive = i === active
                return (
                  <motion.button
                    key={module.key}
                    type="button"
                    whileHover={{ y: -3 }}
                    onMouseEnter={() => {
                      setPaused(true)
                      setActive(i)
                    }}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setActive(i)}
                    className="isolate relative min-w-0 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-brand-500/40"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="heroModuleHighlight"
                        className="absolute inset-0 -z-10 rounded-xl bg-white/10 ring-1 ring-brand-400/50"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      />
                    )}
                    <Icon
                      className={`h-5 w-5 transition-colors ${isActive ? 'text-brand-300' : 'text-brand-400/80'}`}
                    />
                    <div className="mt-2 break-words text-[11px] font-medium text-white/80">
                      {module.title}
                    </div>
                  </motion.button>
                )
              })}
            </div>

            <div className="mt-5 min-h-[4.25rem] rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:min-h-[3.5rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={ERP_MODULES[active].key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs leading-relaxed text-ink-300"
                >
                  {ERP_MODULES[active].description}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute -right-6 -top-6 hidden animate-float items-center gap-2 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card sm:flex"
          >
            <RefreshCcw className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-semibold text-ink-800">Real-time sync</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10, rotate: 5 }}
            animate={{ opacity: 1, y: 0, rotate: 5 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute -bottom-6 -left-6 hidden animate-float-delay items-center gap-2 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card sm:flex"
          >
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold text-ink-800">Live dashboards</span>
          </motion.div>
        </div>
      </Reveal>
    </div>
  )
}

export function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-24 pt-40">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -inset-x-1/4 -top-1/3 aspect-square rounded-full bg-aurora opacity-60 blur-3xl" />
        <div className="absolute inset-0 bg-radial-fade" />
        <AmbientDots />

        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex animate-ring-pulse items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                ERP built for how you actually work
              </span>
            </Reveal>
            <AnimatedText
              as="h1"
              text="One platform to run every part of your business"
              highlight="every part"
              delay={0.15}
              className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-6xl"
            />
            <Reveal delay={0.2} soft>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
                CoreFlowTech builds ERP software and web platforms for engineering, healthcare,
                technology and manufacturing businesses — one connected system instead of ten
                disconnected tools.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button to="/services/erp-solutions" withArrow>
                  Explore ERP Solutions
                </Button>
                <Button to="/contact" variant="secondary">
                  Talk to our team
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.35} className="mt-10">
              <Marquee items={MARQUEE_ITEMS} className="max-w-xl" />
            </Reveal>
          </div>

          <HeroVisual />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="mt-16 flex flex-col items-center gap-2"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              Scroll
            </span>
            <span className="flex h-9 w-5 items-start justify-center rounded-full border border-ink-200 p-1">
              <span className="h-1.5 w-1 animate-bob-hint rounded-full bg-brand-500" />
            </span>
          </motion.div>
        </Container>
      </section>

      <StatsBar />

      {/* Services */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="What we do"
            title="Two ways we help you move faster"
            description="Whether it's your internal operations or your public presence, we build it to last."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {SERVICE_CARDS.map(({ icon: Icon, title, description, to }, i) => (
              <Reveal key={title} delay={i * 0.1} zoom>
                <SpotlightCard className="card-hover gradient-ring h-full rounded-3xl border border-ink-100 bg-white shadow-card">
                  <Link to={to} className="block h-full p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                      <Icon className="icon-hover h-6 w-6" />
                    </div>
                    <h3 className="mt-6 font-display text-xl font-semibold text-ink-900">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">{description}</p>
                    <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform duration-300 group-hover:translate-x-1">
                      Learn more →
                    </span>
                  </Link>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ERP modules highlight */}
      <section className="relative bg-ink-950 py-24">
        <SectionWave />
        <Container>
          <SectionHeading
            eyebrow="ERP Solutions"
            title="Every module. One connected system."
            description="No more juggling spreadsheets and disconnected tools — everything talks to everything."
            className="[&_h2]:text-white [&_p]:text-ink-400"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ERP_MODULES.map((module, i) => {
              const Icon = MODULE_ICONS[module.key] ?? Users2
              return (
                <Reveal key={module.key} delay={i * 0.06} zoom>
                  <SpotlightCard
                    glow="rgba(78, 157, 255, 0.22)"
                    className="card-hover h-full rounded-2xl border border-white/10 bg-white/5"
                  >
                    <div className="p-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand-400">
                        <Icon className="icon-hover h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-base font-semibold text-white">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-400">
                        {module.description}
                      </p>
                    </div>
                  </SpotlightCard>
                </Reveal>
              )
            })}
          </div>
          <Reveal delay={0.3} className="mt-12 text-center">
            <Button to="/services/erp-solutions" withArrow>
              See full ERP feature set
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* Industries */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Industries"
            title="Built across sectors, tuned to each one"
            description="The same solid core, configured for how your industry actually operates."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry, i) => {
              const Icon = INDUSTRY_ICONS[industry.key] ?? ShieldCheck
              return (
                <Reveal key={industry.key} delay={i * 0.06} zoom>
                  <SpotlightCard className="card-hover gradient-ring h-full rounded-2xl border border-ink-100 hover:bg-brand-50/40">
                    <div className="p-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon className="icon-hover h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-display text-base font-semibold text-ink-900">
                        {industry.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">
                        {industry.description}
                      </p>
                    </div>
                  </SpotlightCard>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Products */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Products"
            title="Tools we've built for the tech industry"
            description="Alongside client work, we ship our own products for common operational needs."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <Reveal key={product.key} delay={i * 0.08} zoom>
                <SpotlightCard className="card-hover gradient-ring h-full rounded-3xl border border-white bg-white/70 shadow-card backdrop-blur">
                  <div className="p-7">
                    <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {product.category}
                    </span>
                    <h3 className="mt-3 font-display text-lg font-semibold text-ink-900">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {product.description}
                    </p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3} className="mt-12 text-center">
            <Button to="/products" variant="secondary" withArrow>
              View all products
            </Button>
          </Reveal>
        </Container>
      </section>

      <CtaBanner
        title="Ready to bring your operations onto one platform?"
        description="Tell us how your business runs today — we'll show you what it looks like on CoreFlowTech."
      />
    </div>
  )
}
