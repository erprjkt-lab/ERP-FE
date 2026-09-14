import { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'

interface CountUpProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({ value, decimals = 0, prefix = '', suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, latest => latest.toFixed(decimals))

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionValue, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [inView, motionValue, value])

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}
