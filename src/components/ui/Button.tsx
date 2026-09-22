import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  to?: string
  href?: string
  onClick?: () => void
  variant?: Variant
  withArrow?: boolean
  className?: string
  children: ReactNode
  type?: 'button' | 'submit'
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-glow',
  secondary: 'bg-white text-ink-900 border border-ink-200 hover:border-brand-400',
  ghost: 'text-ink-900 hover:text-brand-600',
}

const MotionLink = motion.create(Link)

const tap = { scale: 0.96 }
const hover = { scale: 1.04 }

/** How far the button drifts toward the cursor, as a share of the offset. */
const MAGNET_STRENGTH = 0.28

export function Button({
  to,
  href,
  onClick,
  variant = 'primary',
  withArrow,
  className = '',
  children,
  type = 'button',
}: ButtonProps) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 260, damping: 18, mass: 0.4 })
  const y = useSpring(my, { stiffness: 260, damping: 18, mass: 0.4 })

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set((event.clientX - (rect.left + rect.width / 2)) * MAGNET_STRENGTH)
    my.set((event.clientY - (rect.top + rect.height / 2)) * MAGNET_STRENGTH)
  }

  const handleMouseLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const base = `group relative isolate inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-semibold transition-shadow duration-300 ${VARIANT_CLASSES[variant]} ${className}`
  // onClick lives here (not just on the plain-button branch below) so it
  // still fires — for tracking, say — on a `to`/`href` button alongside the
  // navigation, instead of being silently dropped.
  const motionProps = {
    style: { x, y },
    whileHover: hover,
    whileTap: tap,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick,
    className: base,
  }
  const content = (
    <>
      {variant !== 'ghost' && <span className="shine absolute inset-0" aria-hidden />}
      <span className="relative">{children}</span>
      {withArrow && (
        <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </>
  )

  if (to) {
    return (
      <MotionLink to={to} {...motionProps}>
        {content}
      </MotionLink>
    )
  }
  if (href) {
    return (
      <motion.a href={href} target="_blank" rel="noreferrer" {...motionProps}>
        {content}
      </motion.a>
    )
  }
  return (
    <motion.button type={type} {...motionProps}>
      {content}
    </motion.button>
  )
}
