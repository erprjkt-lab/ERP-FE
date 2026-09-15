import type { FC, ReactNode } from 'react'

interface MarqueeProps {
  items: ReactNode[]
  className?: string
}

export const Marquee: FC<MarqueeProps> = ({ items, className = '' }) => (
  <div
    className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
  >
    <div className="group flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
      {[...items, ...items].map((item, i) => (
        <div
          key={i}
          className="flex shrink-0 items-center gap-2 rounded-full border border-ink-100 bg-white px-5 py-2 text-sm font-medium text-ink-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-glow"
        >
          {item}
        </div>
      ))}
    </div>
  </div>
)
