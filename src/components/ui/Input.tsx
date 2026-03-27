import { forwardRef, InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, prefix, className, disabled, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
          >
            {label}
          </label>
        )}

        {prefix ? (
          <div className={clsx(
            'flex items-center rounded-lg border px-3 py-2 text-sm transition-all',
            'bg-surface dark:bg-stone-800',
            'focus-within:ring-2 focus-within:ring-amber-500',
            error ? 'border-red-400 dark:border-red-500' : 'border-stone-300 dark:border-stone-600',
            disabled && 'opacity-50 cursor-not-allowed',
          )}>
            <span className="text-stone-400 dark:text-stone-500 whitespace-nowrap mr-1 text-xs sm:text-sm">{prefix}</span>
            <input
              ref={ref}
              id={inputId}
              disabled={disabled}
              className={clsx(
                'flex-1 bg-transparent text-sm',
                'text-stone-900 dark:text-stone-100',
                'placeholder-stone-400 dark:placeholder-stone-500',
                'focus:outline-none',
                className
              )}
              {...props}
            />
          </div>
        ) : (
          <div className="relative">
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                {leftIcon}
              </div>
            )}

            <input
              ref={ref}
              id={inputId}
              disabled={disabled}
              className={clsx(
                'w-full text-sm rounded-lg border transition-all',
                'px-3 py-2',
                'bg-surface dark:bg-stone-800',
                'text-stone-900 dark:text-stone-100',
                'placeholder-stone-400 dark:placeholder-stone-500',
                'focus:outline-none focus:ring-2 focus:ring-amber-500',
                error
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-stone-300 dark:border-stone-600',
                disabled && 'opacity-50 cursor-not-allowed',
                leftIcon && 'pl-9',
                rightIcon && 'pr-9',
                className
              )}
              {...props}
            />

            {rightIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                {rightIcon}
              </div>
            )}
          </div>
        )}

        {(hint || error) && (
          <p className={clsx('text-xs', error ? 'text-red-500 dark:text-red-400' : 'text-stone-400')}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
