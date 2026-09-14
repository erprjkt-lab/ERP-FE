import type { FC } from 'react'

const DOTS = [
  { top: '18%', left: '12%', size: 6, delay: '0s', float: 'animate-float' },
  { top: '30%', left: '82%', size: 4, delay: '0.6s', float: 'animate-float-delay' },
  { top: '62%', left: '18%', size: 5, delay: '1.2s', float: 'animate-float-slow' },
  { top: '75%', left: '70%', size: 7, delay: '0.3s', float: 'animate-float' },
  { top: '45%', left: '92%', size: 4, delay: '1.6s', float: 'animate-float-delay' },
  { top: '10%', left: '55%', size: 5, delay: '0.9s', float: 'animate-float-slow' },
]

/** A handful of faint twinkling dots — pure ambience, kept low-opacity so it never competes with content. */
export const AmbientDots: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
    {DOTS.map((dot, i) => (
      <span
        key={i}
        className={`absolute rounded-full bg-brand-400 animate-twinkle ${dot.float}`}
        style={{
          top: dot.top,
          left: dot.left,
          width: dot.size,
          height: dot.size,
          animationDelay: dot.delay,
        }}
      />
    ))}
  </div>
)
