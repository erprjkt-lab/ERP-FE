import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { AnimatedText } from '@/components/ui/AnimatedText'

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

      {/* Slow orbiting glows give the flat gradient some movement. */}
      <motion.div
        aria-hidden
        animate={{ x: [0, 40, 0], y: [0, -24, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, -32, 0], y: [0, 28, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-violet-300/15 blur-3xl"
      />

      <Container className="relative text-center">
        <AnimatedText
          as="h2"
          text={title}
          className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        />
        <Reveal delay={0.2} blur>
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
