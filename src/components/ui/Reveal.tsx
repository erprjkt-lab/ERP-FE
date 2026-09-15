import type { FC, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  /** Adds a short focus-in blur on top of the rise — good for hero content. */
  blur?: boolean
  /** Scales up very slightly as it lands. */
  zoom?: boolean
}

export const Reveal: FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  y = 24,
  blur = false,
  zoom = false,
}) => (
  <motion.div
    initial={{
      opacity: 0,
      y,
      ...(blur ? { filter: 'blur(10px)' } : {}),
      ...(zoom ? { scale: 0.96 } : {}),
    }}
    whileInView={{
      opacity: 1,
      y: 0,
      ...(blur ? { filter: 'blur(0px)' } : {}),
      ...(zoom ? { scale: 1 } : {}),
    }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)
