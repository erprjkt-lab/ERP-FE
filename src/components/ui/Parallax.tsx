import { useRef } from 'react'
import type { FC, ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

interface ParallaxProps {
  children: ReactNode
  className?: string
  /** Higher drifts further against the scroll; negative reverses direction. */
  speed?: number
}

/** Drifts its children as the section scrolls past, for depth behind content. */
export const Parallax: FC<ParallaxProps> = ({ children, className = '', speed = 0.25 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const raw = useTransform(scrollYProgress, [0, 1], [speed * 120, speed * -120])
  const y = useSpring(raw, { stiffness: 80, damping: 26, restDelta: 0.5 })

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}
