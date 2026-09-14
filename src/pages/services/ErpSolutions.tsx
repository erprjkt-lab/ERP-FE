import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Database,
  Factory,
  LayoutGrid,
  Lock,
  RefreshCcw,
  Settings2,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users2,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { ERP_BENEFITS, ERP_MODULES, ERP_WORKFLOW } from '@/data/site'

const PLATFORM_HIGHLIGHTS = [
  { icon: LayoutGrid, label: 'Modular by design' },
  { icon: Zap, label: 'Real-time data' },
  { icon: Lock, label: 'Role-based access' },
  { icon: RefreshCcw, label: 'Configurable workflows' },
]

const BENEFIT_ICONS: Record<string, typeof Database> = {
  'One source of truth': Database,
  'Built for your process': Settings2,
  'Scales as you grow': TrendingUp,
  'Real-time visibility': Activity,
}

const MODULE_ICONS: Record<string, typeof Users2> = {
  hr: Users2,
  finance: Wallet,
  inventory: Boxes,
  production: Factory,
  procurement: ClipboardList,
  sales: ShoppingCart,
}

const WITHOUT_ERP = [
  'Data re-typed across spreadsheets and disconnected tools',
  'Stock counts and financials only accurate after manual reconciliation',
  'Reports built by hand, days after the numbers actually mattered',
  'Every department sees a different version of the truth',
]

const WITH_ERP = [
  'One record per employee, item and order — entered once',
  'Stock and financial data update the moment something happens',
  'Dashboards reflect what is true right now, not last week',
  'Every department works from the same live numbers',
]

export function ErpSolutions() {
  const [activeModule, setActiveModule] = useState(ERP_MODULES[0].key)
  const current = ERP_MODULES.find(m => m.key === activeModule) ?? ERP_MODULES[0]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-radial-fade" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                <Sparkles className="h-3.5 w-3.5" />
                ERP Solutions
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                Every department. <span className="text-gradient">One system.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">
                CoreFlowTech ERP connects HR, finance, inventory, production, procurement and sales
                into a single platform — configured around how your business actually runs, not a
                rigid template you have to adapt to.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button to="/contact" withArrow>
                  Book a walkthrough
                </Button>
                <Button to="/industries" variant="secondary">
                  See it by industry
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.35} className="mt-14">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
              {PLATFORM_HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-xs font-semibold text-ink-700 shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-brand-600" />
                  {label}
                </span>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ERP_BENEFITS.map((benefit, i) => {
              const Icon = BENEFIT_ICONS[benefit.title] ?? Database
              return (
                <Reveal key={benefit.title} delay={i * 0.08}>
                  <div className="card-hover group h-full rounded-2xl border border-ink-100 p-6 hover:bg-brand-50/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="icon-hover h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-ink-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">
                      {benefit.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Before / after */}
      <section className="bg-ink-50/60 py-24">
        <Container>
          <SectionHeading
            eyebrow="Why it matters"
            title="What actually changes on day one"
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-ink-100 bg-white p-8">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Without CoreFlowTech
                </span>
                <ul className="mt-5 space-y-4">
                  {WITHOUT_ERP.map(point => (
                    <li key={point} className="flex items-start gap-3 text-sm text-ink-600">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                        <X className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="h-full rounded-3xl border border-brand-200 bg-white p-8 shadow-glow">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  With CoreFlowTech
                </span>
                <ul className="mt-5 space-y-4">
                  {WITH_ERP.map(point => (
                    <li key={point} className="flex items-start gap-3 text-sm text-ink-800">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Interactive module explorer */}
      <section className="bg-ink-950 py-24">
        <Container>
          <SectionHeading
            eyebrow="Feature set"
            title="Explore what each module covers"
            className="[&_h2]:text-white [&_p]:text-ink-400"
          />

          <div className="mt-14 grid gap-8 lg:grid-cols-[280px_1fr]">
            <Reveal className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {ERP_MODULES.map(module => {
                const Icon = MODULE_ICONS[module.key] ?? Users2
                const isActive = activeModule === module.key
                return (
                  <button
                    key={module.key}
                    onClick={() => setActiveModule(module.key)}
                    className={`relative isolate flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors lg:w-full ${
                      isActive ? 'text-white' : 'text-ink-300 hover:bg-white/10'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="module-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-brand-gradient"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {module.title}
                  </button>
                )
              })}
            </Reveal>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10"
              >
                <h3 className="font-display text-2xl font-semibold text-white">{current.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-400">
                  {current.description}
                </p>
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {current.points.map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-ink-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </Container>
      </section>

      {/* Workflow */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Implementation"
            title="How a rollout actually goes"
            description="No big-bang rewrite of your operations — a structured path from discovery to go-live and beyond."
          />
          <div className="relative mt-16">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-ink-100 lg:block" />
            <div className="grid gap-8 lg:grid-cols-5">
              {ERP_WORKFLOW.map((item, i) => (
                <Reveal key={item.step} delay={i * 0.08} className="relative">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient font-display text-sm font-semibold text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <CtaBanner
        title="See CoreFlowTech ERP on your own data"
        description="We'll walk through your current process and show exactly how it maps onto the platform."
        primaryLabel="Book a walkthrough"
      />
    </div>
  )
}
