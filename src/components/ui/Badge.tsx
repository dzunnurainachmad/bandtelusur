import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'green'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-amber-100 text-amber-800': variant === 'default',
          'border border-stone-300 text-stone-600': variant === 'outline',
          'bg-emerald-100 text-emerald-800': variant === 'green',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
