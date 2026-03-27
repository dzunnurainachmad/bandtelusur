import { forwardRef, TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className, disabled, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={clsx(
            'w-full text-sm rounded-lg border resize-y',
            'px-3 py-2',
            'bg-surface dark:bg-stone-800',
            'text-stone-900 dark:text-stone-100',
            'placeholder-stone-400 dark:placeholder-stone-500',
            'focus:outline-none focus:ring-2 focus:ring-amber-500',
            error
              ? 'border-red-400 dark:border-red-500'
              : 'border-stone-300 dark:border-stone-600',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />

        {(hint || error) && (
          <p className={clsx('text-xs', error ? 'text-red-500 dark:text-red-400' : 'text-stone-400 text-right')}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
