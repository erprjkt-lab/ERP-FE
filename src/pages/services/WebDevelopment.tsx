import { Code2, Gauge, Layers, Search, Smartphone, Wrench } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CtaBanner } from '@/components/sections/CtaBanner'

const CAPABILITIES = [
  {
    icon: Layers,
    title: 'Marketing sites',
    description: 'Fast, custom-designed sites that make a strong first impression.',
  },
  {
    icon: Code2,
    title: 'Web platforms',
    description: 'Customer portals, dashboards and internal tools built to spec.',
  },
  {
    icon: Smartphone,
    title: 'Responsive by default',
    description: 'Every build is tested and tuned across phone, tablet and desktop.',
  },
  {
    icon: Gauge,
    title: 'Performance-first',
    description: 'Optimized load times and Core Web Vitals, not an afterthought.',
  },
  {
    icon: Search,
    title: 'SEO-ready foundations',
    description: 'Semantic markup, metadata and structure built in from day one.',
  },
  {
    icon: Wrench,
    title: 'Ongoing support',
    description: 'We stay on to fix, extend and maintain after launch.',
  },
]

const PROCESS = [
  { step: '01', title: 'Brief', description: 'We learn your goals, audience and content.' },
  { step: '02', title: 'Design', description: 'A custom look — never a generic template.' },
  { step: '03', title: 'Build', description: 'Modern, maintainable code, reviewed and tested.' },
  { step: '04', title: 'Launch & support', description: 'We ship it, then stay on to support it.' },
]

export function WebDevelopment() {
  return (
    <div>
      <section className="relative overflow-hidden pb-20 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                Web Development
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                Websites built to represent your business well
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">
                From marketing sites to full web platforms, we design and build fast, modern
                experiences — no page builders, no generic templates.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex justify-center">
                <Button to="/contact" withArrow>
                  Start a project
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <SectionHeading eyebrow="Capabilities" title="What we build" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 0.07}>
                <div className="card-hover group h-full rounded-2xl border border-ink-100 bg-white p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="icon-hover h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold text-ink-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink-50/60 py-24">
        <Container>
          <SectionHeading eyebrow="Process" title="From brief to launch" />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.08}>
                <div className="font-display text-3xl font-semibold text-brand-200">{item.step}</div>
                <h3 className="mt-3 font-display text-base font-semibold text-ink-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner
        title="Have a website project in mind?"
        description="Tell us what you're building — we'll scope it out together."
        primaryLabel="Start a project"
      />
    </div>
  )
}
