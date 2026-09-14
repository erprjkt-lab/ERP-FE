import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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
const hover = { scale: 1.035, y: -2 }

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
  const base = `group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-shadow duration-300 ${VARIANT_CLASSES[variant]} ${className}`
  const content = (
    <>
      {children}
      {withArrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </>
  )

  if (to) {
    return (
      <MotionLink to={to} whileHover={hover} whileTap={tap} className={base}>
        {content}
      </MotionLink>
    )
  }
  if (href) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noreferrer"
        whileHover={hover}
        whileTap={tap}
        className={base}
      >
        {content}
      </motion.a>
    )
  }
  return (
    <motion.button type={type} onClick={onClick} whileHover={hover} whileTap={tap} className={base}>
      {content}
    </motion.button>
  )
}
