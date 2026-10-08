import type { FC } from 'react'

export const Logo: FC<{ dark?: boolean; className?: string; size?: number }> = ({
  dark,
  className = '',
  size = 32,
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <svg
      viewBox="0 0 468 397"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
      style={{
        height: `${size}px`,
        width: `${Math.round((size * 468) / 397)}px`,
        maxHeight: `${size}px`,
        maxWidth: `${Math.round((size * 468) / 397)}px`,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="cf_logo_grad"
          gradientUnits="userSpaceOnUse"
          x1="329.245"
          y1="356.134"
          x2="108.975"
          y2="36.7396"
        >
          <stop offset="0" stopColor="#0289C3" />
          <stop offset="0.301961" stopColor="#02809E" />
          <stop offset="1" stopColor="#017678" />
        </linearGradient>
      </defs>
      <path
        fill="#00A0E3"
        d="M275 231l74 2c0,0 38,1 65,-83l-172 0c0,0 -43,2 -55,38l-39 108 22 92c0,0 18,25 32,-6 12,-33 37,-152 73,-151z"
      />
      <path
        fill="url(#cf_logo_grad)"
        d="M124 295c0,0 -79,-65 -23,-147 58,-85 210,-60 306,-61 0,0 47,-10 61,-86l-280 2c0,0 -147,14 -183,165 -36,151 109,220 109,220l15 6 -6 -98z"
      />
    </svg>
    <span
      className={`font-display text-lg font-semibold tracking-tight ${
        dark ? 'text-white' : 'text-ink-900'
      }`}
    >
      CoreFlowTech
    </span>
  </div>
)
