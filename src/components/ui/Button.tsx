import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'ghost-amber' | 'danger' | 'danger-ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-60',
  secondary:
    'border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 disabled:opacity-60',
  ghost:
    'text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-500 disabled:opacity-50',
  'ghost-amber':
    'text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60',
  'danger-ghost':
    'text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
  'icon-sm': 'p-2',
  icon: 'p-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
