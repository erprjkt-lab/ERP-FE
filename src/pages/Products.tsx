import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedText } from '@/components/ui/AnimatedText'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { CtaBanner } from '@/components/sections/CtaBanner'
import { PRODUCTS } from '@/data/site'

export function Products() {
  return (
    <div>
      <section className="relative overflow-hidden pb-16 pt-40">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
                Products
              </span>
            </Reveal>
            <AnimatedText
              as="h1"
              text="Tools we've built for the tech industry"
              highlight="tech industry"
              delay={0.1}
              className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl"
            />
            <Reveal delay={0.25} soft>
              <p className="mt-6 text-lg leading-relaxed text-ink-500">
                Alongside client ERP and web projects, we ship our own products for common
                operational problems.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <Reveal key={product.key} delay={i * 0.08} zoom>
                <SpotlightCard className="card-hover gradient-ring h-full rounded-3xl border border-ink-100 bg-white shadow-card">
                  <div className="flex h-full flex-col p-8">
                    <span className="w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {product.category}
                    </span>
                    <h3 className="mt-6 font-display text-xl font-semibold text-ink-900">
                      {product.name}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">
                      {product.description}
                    </p>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBanner
        title="Curious how these fit your team?"
        description="We're happy to walk through any of our products in more detail."
      />
    </div>
  )
}
