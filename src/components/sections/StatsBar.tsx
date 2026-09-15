import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { CountUp } from '@/components/ui/CountUp'
import { STATS } from '@/data/site'

export function StatsBar() {
  return (
    <section className="relative overflow-hidden border-y border-ink-100 bg-ink-50/60 py-14">
      {/* A light beam that sweeps the band, tying it to the brand gradient. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-beam-x bg-gradient-to-r from-transparent via-brand-200/25 to-transparent"
      />
      <Container className="relative">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="min-w-0 text-center"
            >
              <CountUp
                value={stat.value}
                decimals={stat.decimals}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="font-display text-3xl font-semibold text-brand-600 sm:text-4xl"
              />
              <div className="mt-1 text-sm text-ink-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
