import type { FC } from 'react'
import { motion } from 'framer-motion'
import { AnimatedText } from './AnimatedText'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export const SectionHeading: FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) => (
  <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
    {eyebrow && (
      <motion.span
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700"
      >
        {eyebrow}
      </motion.span>
    )}
    <AnimatedText
      as="h2"
      text={title}
      delay={0.05}
      className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl"
    />
    {description && (
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 text-base leading-relaxed text-ink-500"
      >
        {description}
      </motion.p>
    )}
  </div>
)
