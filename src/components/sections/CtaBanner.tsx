import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

interface CtaBannerProps {
  title: string
  description: string
  primaryLabel?: string
  primaryTo?: string
}

export function CtaBanner({
  title,
  description,
  primaryLabel = 'Talk to us',
  primaryTo = '/contact',
}: CtaBannerProps) {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-brand-gradient animated-gradient" />
      <div className="absolute inset-0 bg-grid opacity-[0.08]" />
      <Container className="relative text-center">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80">{description}</p>
          <div className="mt-8 flex justify-center">
            <Button to={primaryTo} variant="secondary" withArrow className="!bg-white">
              {primaryLabel}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
