import { Button as AntButton } from 'antd'
import type { ButtonProps as AntButtonProps } from 'antd'
import type { FC, ReactNode } from 'react'

export interface ButtonProps extends AntButtonProps {
  children?: ReactNode
}

export const Button: FC<ButtonProps> = ({ children, ...props }) => {
  return <AntButton {...props}>{children}</AntButton>
}
