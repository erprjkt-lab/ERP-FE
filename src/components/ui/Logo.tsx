import type { FC } from 'react'

export const Logo: FC<{ dark?: boolean; className?: string }> = ({ dark, className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <svg width="34" height="34" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="46" height="46" rx="12" fill="#1677ff" />
      <path d="M13 29C13 22.9249 17.9249 18 24 18H33" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M33 18L28.5 13.5" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 18L28.5 22.5" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="29" r="3.2" fill="white" />
    </svg>
    <span className={`font-display text-lg font-semibold tracking-tight ${dark ? 'text-white' : 'text-ink-900'}`}>
      CoreFlowTech
    </span>
  </div>
)
