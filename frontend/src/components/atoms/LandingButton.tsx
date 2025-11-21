import React from 'react'
import { cn } from '../../lib/utils'

export interface LandingButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  asChild?: boolean
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

export default function LandingButton({
  variant = 'primary',
  size = 'md',
  children,
  className,
  asChild = false,
  ...props
}: LandingButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95'

  const variants = {
    primary:
      'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:shadow-lg hover:shadow-brand-500/40 border border-transparent',
    secondary: 'bg-white text-brand-900 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200',
    outline: 'bg-transparent border-2 border-brand-600 text-brand-600 hover:bg-brand-50',
    ghost: 'bg-transparent text-slate-600 hover:text-brand-600 hover:bg-slate-100',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const composedClassName = cn(baseStyles, variants[variant], sizes[size], className)

  if (asChild && React.isValidElement(children)) {
    const { onClick, ...restProps } = props
    const childProps = (children as React.ReactElement<any>).props || {}
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      childProps.onClick?.(event)
      onClick?.(event)
    }
    return React.cloneElement(children as React.ReactElement<any>, {
      ...restProps,
      className: cn(composedClassName, childProps.className),
      onClick: handleClick,
    })
  }

  const { type, onClick, ...buttonProps } = props

  return (
    <button
      type={type ?? 'button'}
      className={composedClassName}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
