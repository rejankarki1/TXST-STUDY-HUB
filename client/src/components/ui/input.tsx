import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground shadow-xs transition-colors',
        'placeholder:text-faint-foreground',
        'hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--border-strong))]',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15',
        'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full rounded-md border border-border-strong bg-surface px-3 py-2.5 text-sm text-foreground shadow-xs transition-colors',
        'placeholder:text-faint-foreground',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15',
        'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn('block text-[13px] font-medium text-foreground', className)}
      {...props}
    />
  )
}

/** Label + control + optional inline error, the standard form row. */
function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="shrink-0 text-xs text-faint-foreground">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export { Input, Textarea, Label, Field }
