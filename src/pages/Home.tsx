import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  BarChart3,
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

  const chartValues = [42, 58, 48, 66, 60, 74, 68, 82, 76, 88]
  const chartWidth = 334
  const chartHeight = 56
  const chartPad = 4
  const chartMax = Math.max(...chartValues)
  const chartMin = Math.min(...chartValues)
  const chartPoints = chartValues.map((v, i) => {
    const x = chartPad + (i * (chartWidth - chartPad * 2)) / (chartValues.length - 1)
    const y =
      chartPad + (1 - (v - chartMin) / (chartMax - chartMin)) * (chartHeight - chartPad * 2)
    return [x, y] as const
  })
  const chartLinePath = chartPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
  const chartAreaPath = `${chartLinePath} L${chartPoints[chartPoints.length - 1][0]},${chartHeight} L${chartPoints[0][0]},${chartHeight} Z`

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

      {/* Purely ambient — always drifting, independent of the cursor. */}
      <div
        className="absolute left-1/3 -top-10 h-56 w-56 animate-drift-c rounded-full bg-brand-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-16 right-1/4 h-64 w-64 animate-drift-a rounded-full bg-violet-300/25 blur-3xl [animation-delay:-6s]"
        aria-hidden
      />

      <Reveal delay={0.4} className="relative mt-20">
        <div className="relative mx-auto max-w-5xl rounded-3xl border border-ink-100 bg-white/70 p-3 shadow-card backdrop-blur">
          <div className="rounded-2xl bg-ink-950 p-6 sm:p-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                <span className="text-xs font-semibold text-white/70">Operations overview · live</span>
              </div>
              <span className="hidden text-xs text-ink-500 sm:block">Illustrative preview</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Job cards live', value: '24' },
                { label: 'Stock accuracy', value: '98%' },
                { label: 'On-time delivery', value: '96%' },
                { label: 'Open tickets', value: '3' },
              ].map(metric => (
                <div
                  key={metric.label}
                  className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="font-display text-xl font-semibold text-white sm:text-2xl">
                    {metric.value}
                  </div>
                  <div className="mt-1 break-words text-[11px] font-medium text-ink-400">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 h-20 rounded-xl border border-white/10 bg-white/5 px-4 pb-3 pt-3">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="heroAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4e9dff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4e9dff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="heroLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4e9dff" />
                    <stop offset="100%" stopColor="#8f6bff" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={chartAreaPath}
                  fill="url(#heroAreaGradient)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />
                <motion.path
                  d={chartLinePath}
                  fill="none"
                  stroke="url(#heroLineGradient)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                />
              </svg>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: Users2, label: 'HR & Payroll' },
                { icon: BarChart3, label: 'Finance' },
                { icon: Boxes, label: 'Inventory' },
                { icon: Factory, label: 'Production' },
              ].map(({ icon: Icon, label }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -4 }}
                  className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4 text-center transition-colors hover:border-brand-500/50 hover:bg-white/[0.08]"
                >
                  <Icon className="mx-auto h-5 w-5 text-brand-400" />
                  <div className="mt-2 break-words text-[11px] font-medium text-white/80">
                    {label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

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
            <Reveal delay={0.1}>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-6xl">
                One platform to run{' '}
                <span className="text-gradient bg-[length:200%_auto] animate-gradient-x">
                  every part
                </span>{' '}
                of your business
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
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
              <Reveal key={title} delay={i * 0.1}>
                <a
                  href={to}
                  className="card-hover group block h-full rounded-3xl border border-ink-100 bg-white p-8 shadow-card"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                    <Icon className="icon-hover h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-ink-900">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{description}</p>
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
                    Learn more →
                  </span>
                </a>
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
                <Reveal key={module.key} delay={i * 0.06}>
                  <div className="card-hover group h-full rounded-2xl border border-white/10 bg-white/5 p-6">
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
                <Reveal key={industry.key} delay={i * 0.06}>
                  <div className="card-hover group h-full rounded-2xl border border-ink-100 p-6 hover:bg-brand-50/40">
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
              <Reveal key={product.key} delay={i * 0.08}>
                <div className="card-hover h-full rounded-3xl border border-white bg-white/70 p-7 shadow-card backdrop-blur">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    {product.category}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-ink-900">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{product.description}</p>
                </div>
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
