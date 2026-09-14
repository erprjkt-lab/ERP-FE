import type { FC, HTMLAttributes } from 'react'

export const Container: FC<HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div className={`mx-auto w-full max-w-7xl px-6 lg:px-8 ${className}`} {...props}>
    {children}
  </div>
)
