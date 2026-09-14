import type { FC } from 'react'
import { Reveal } from './Reveal'

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
  <Reveal
    className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}
  >
    {eyebrow && (
      <span className="mb-3 inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
        {eyebrow}
      </span>
    )}
    <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
      {title}
    </h2>
    {description && <p className="mt-4 text-base leading-relaxed text-ink-500">{description}</p>}
  </Reveal>
)
