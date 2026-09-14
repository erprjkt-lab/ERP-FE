import { Factory, HeartPulse, Cpu, Truck, Store, Boxes } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { INDUSTRIES } from '@/data/site'

const ICONS: Record<string, typeof Factory> = {
  engineering: Factory,
  medicine: HeartPulse,
  tech: Cpu,
  retail: Store,
  logistics: Truck,
  trading: Boxes,
}

export function Industries() {
  return (
    <div>
      <section className="relative overflow-hidden pb-16 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                Industries
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                Built across sectors, tuned to each one
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 text-lg leading-relaxed text-ink-500">
                The same solid ERP core, configured around how your industry actually operates.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry, i) => {
              const Icon = ICONS[industry.key] ?? Factory
              return (
                <Reveal key={industry.key} delay={i * 0.07}>
                  <div className="card-hover group h-full rounded-3xl border border-ink-100 bg-white p-8 shadow-card">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                      <Icon className="icon-hover h-6 w-6" />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-ink-900">
                      {industry.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">
                      {industry.description}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </section>

      <SectionHeading
        eyebrow="Don't see your industry?"
        title="We configure the platform, not the other way around"
        description="If your business runs on processes rather than a rigid template, chances are we can build for it."
        className="pb-16"
      />

      <CtaBanner
        title="Tell us about your industry"
        description="We'll be upfront about how well CoreFlowTech fits your specific operation."
      />
    </div>
  )
}
