import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-button hover:bg-primary-hover hover:shadow-md active:shadow-xs',
        secondary:
          'border border-border-strong bg-surface-raised text-foreground shadow-xs hover:border-border-strong hover:bg-surface-hover hover:shadow-sm active:bg-surface-active',
        ghost: 'text-foreground-soft hover:bg-surface-hover hover:text-foreground active:bg-surface-active',
        subtle:
          'border border-primary-border bg-primary-subtle text-primary shadow-xs hover:bg-primary-subtle-hover hover:shadow-sm active:bg-primary-subtle-hover',
        danger:
          'border border-border-strong bg-surface text-danger shadow-xs hover:border-danger/40 hover:bg-danger-subtle hover:shadow-sm active:bg-danger-subtle',
        link: 'text-primary underline-offset-4 hover:underline active:translate-y-0',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-11 px-5 text-[15px] [&_svg]:size-4',
        icon: 'size-10 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
