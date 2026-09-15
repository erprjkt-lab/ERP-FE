import type { FC, ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  /** Colour of the glow that tracks the cursor. */
  glow?: string
}

// Parked far outside the box so the glow starts hidden rather than sitting in
// a corner before the pointer ever enters.
const OFFSCREEN = -9999

export const SpotlightCard: FC<SpotlightCardProps> = ({
  children,
  className = '',
  glow = 'rgba(22, 119, 255, 0.18)',
}) => {
  const mx = useMotionValue(OFFSCREEN)
  const my = useMotionValue(OFFSCREEN)
  const background = useMotionTemplate`radial-gradient(240px circle at ${mx}px ${my}px, ${glow}, transparent 70%)`

  return (
    <div
      onMouseMove={event => {
        const rect = event.currentTarget.getBoundingClientRect()
        mx.set(event.clientX - rect.left)
        my.set(event.clientY - rect.top)
      }}
      onMouseLeave={() => {
        mx.set(OFFSCREEN)
        my.set(OFFSCREEN)
      }}
      className={`group relative overflow-hidden ${className}`}
    >
      {/* Absolute glow first, content after — DOM order keeps the text on top
          without either needing a z-index. */}
      <motion.div
        aria-hidden
        style={{ background }}
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
