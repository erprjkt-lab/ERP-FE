import { motion } from 'framer-motion'
import { CheckCircle2, Globe2, Workflow } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedText } from '@/components/ui/AnimatedText'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CtaBanner } from '@/components/sections/CtaBanner'

const SERVICES = [
  {
    icon: Workflow,
    title: 'ERP Solutions',
    to: '/services/erp-solutions',
    description:
      'A unified system covering HR & payroll, finance, inventory, production, procurement and sales — configured around how your business runs.',
    points: [
      'Modular — start with what you need, add more later',
      'Real-time dashboards across every department',
      'Built for engineering, healthcare, tech and manufacturing',
    ],
  },
  {
    icon: Globe2,
    title: 'Web Development',
    to: '/services/web-development',
    description:
      'Marketing sites, customer portals and web platforms, built fast and designed to represent your business well.',
    points: [
      'Modern, responsive, fast-loading builds',
      'Custom design — never a generic template',
      'Ongoing support after launch',
    ],
  },
]

export function ServicesOverview() {
  return (
    <div>
      <section className="relative overflow-hidden pb-16 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                Services
              </span>
            </Reveal>
            <AnimatedText
              as="h1"
              text="Two disciplines, one standard of quality"
              highlight="one standard"
              delay={0.1}
              className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl"
            />
            <Reveal delay={0.25} blur>
              <p className="mt-6 text-lg leading-relaxed text-ink-500">
                We build the systems that run your business, and the websites that represent it.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            {SERVICES.map(({ icon: Icon, title, to, description, points }, i) => (
              <Reveal key={title} delay={i * 0.1} zoom>
                <SpotlightCard className="card-hover gradient-ring h-full rounded-3xl border border-ink-100 bg-white shadow-card">
                  <div className="flex h-full flex-col p-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                      <Icon className="icon-hover h-7 w-7" />
                    </div>
                    <h2 className="mt-6 font-display text-2xl font-semibold text-ink-900">
                      {title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">{description}</p>
                    <ul className="mt-6 space-y-3">
                      {points.map((point, pointIndex) => (
                        <motion.li
                          key={point}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: 0.15 + pointIndex * 0.07 }}
                          className="flex items-start gap-2.5 text-sm text-ink-700"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Button to={to} withArrow>
                        Explore {title}
                      </Button>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <SectionHeading
        eyebrow="How we work"
        title="Same process, whatever we're building"
        description="Discover the real problem, design around it, build it properly, and stay involved after launch."
        className="pb-16"
      />

      <CtaBanner
        title="Not sure which service you need?"
        description="Tell us what you're trying to solve — we'll point you in the right direction."
      />
    </div>
  )
}
