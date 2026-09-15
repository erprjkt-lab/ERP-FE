import type { FC, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  /** A slightly slower, softer settle — good for hero content following a heading. */
  soft?: boolean
  /** Scales up very slightly as it lands. */
  zoom?: boolean
}

export const Reveal: FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  y = 24,
  soft = false,
  zoom = false,
}) => (
  <motion.div
    initial={{
      opacity: 0,
      y,
      ...(zoom ? { scale: 0.96 } : {}),
    }}
    whileInView={{
      opacity: 1,
      y: 0,
      ...(zoom ? { scale: 1 } : {}),
    }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: soft ? 0.9 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)
