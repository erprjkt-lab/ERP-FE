import type { FC } from 'react'

/** A soft wave seam, meant to sit at the top of a section to blend it into whatever precedes it. */
export const SectionWave: FC<{ fill?: string; className?: string }> = ({
  fill = '#080d1d',
  className = '',
}) => (
  <div className={`pointer-events-none absolute inset-x-0 top-0 -translate-y-[99%] ${className}`}>
    <svg viewBox="0 0 1440 100" className="h-16 w-full sm:h-24" preserveAspectRatio="none">
      <path
        d="M0,40 C240,100 480,0 720,30 C960,60 1200,100 1440,40 L1440,100 L0,100 Z"
        fill={fill}
      />
    </svg>
  </div>
)
