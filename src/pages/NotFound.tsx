import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function NotFound() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden py-32">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <Container className="relative text-center">
        <Reveal>
          <span className="font-display text-8xl font-semibold text-gradient">404</span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
            This page doesn't exist
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink-500">
            The page you're looking for may have moved or never existed.
          </p>
          <div className="mt-8 flex justify-center">
            <Button to="/" withArrow>
              Back to home
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
