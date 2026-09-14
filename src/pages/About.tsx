import { Compass, Handshake, Rocket, Target } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { StatsBar } from '@/components/sections/StatsBar'
import { CtaBanner } from '@/components/sections/CtaBanner'

const VALUES = [
  {
    icon: Target,
    title: 'Built for real workflows',
    description: 'We design around how your team actually works, not a generic template.',
  },
  {
    icon: Handshake,
    title: 'Long-term partnership',
    description: 'We stay involved after go-live — systems evolve as your business does.',
  },
  {
    icon: Compass,
    title: 'Clarity over complexity',
    description: 'Powerful software should still feel simple to use every day.',
  },
  {
    icon: Rocket,
    title: 'Move fast, stay solid',
    description: 'Modern engineering practices without cutting corners on reliability.',
  },
]

export function About() {
  return (
    <div>
      <section className="relative overflow-hidden pb-20 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                About CoreFlowTech
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                We build the systems businesses run on
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">
                CoreFlowTech is a software company focused on two things: enterprise resource
                planning systems that unify how a business operates, and web platforms that
                represent it well. We work across engineering, healthcare, technology and
                manufacturing — building for how each industry actually runs.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <StatsBar />

      <section className="py-24">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Our story
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-900">
                Started by people tired of disconnected software
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-500">
                <p>
                  We kept seeing the same problem across engineering shops, clinics, distributors
                  and tech teams alike: critical data scattered across spreadsheets, standalone
                  tools and manual handoffs. Nothing talked to anything else.
                </p>
                <p>
                  CoreFlowTech exists to fix that — one ERP platform that covers HR, finance,
                  inventory, production, procurement and sales, configured to match how your
                  business actually operates. Alongside that, we build custom web platforms for
                  companies that need a strong, fast presence online.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-3xl border border-ink-100 bg-ink-50/60 p-10">
                <div className="grid grid-cols-2 gap-6 text-center">
                  {[
                    { value: 'Engineering', label: 'Industry served' },
                    { value: 'Healthcare', label: 'Industry served' },
                    { value: 'Technology', label: 'Industry served' },
                    { value: 'Manufacturing', label: 'Industry served' },
                  ].map(item => (
                    <div key={item.value} className="rounded-2xl bg-white p-5 shadow-sm">
                      <div className="font-display text-base font-semibold text-ink-900">
                        {item.value}
                      </div>
                      <div className="mt-1 text-xs text-ink-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-ink-50/60 py-24">
        <Container>
          <SectionHeading
            eyebrow="What we value"
            title="The principles behind how we build"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, description }, i) => (
              <Reveal key={title} delay={i * 0.08}>
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

      <CtaBanner
        title="Want to know if CoreFlowTech fits your business?"
        description="Tell us about your operations — we'll be straightforward about what fits and what doesn't."
      />
    </div>
  )
}
