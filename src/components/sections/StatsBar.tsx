import { Container } from '@/components/ui/Container'
import { CountUp } from '@/components/ui/CountUp'
import { Reveal } from '@/components/ui/Reveal'
import { STATS } from '@/data/site'

export function StatsBar() {
  return (
    <section className="border-y border-ink-100 bg-ink-50/60 py-14">
      <Container>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08} className="min-w-0 text-center">
              <CountUp
                value={stat.value}
                decimals={stat.decimals}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="font-display text-3xl font-semibold text-brand-600 sm:text-4xl"
              />
              <div className="mt-1 text-sm text-ink-500">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
