import {Slot} from '@radix-ui/react-slot'
import {cva, type VariantProps} from 'class-variance-authority'
import type * as React from 'react'

import {cn} from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-black italic w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden tracking-wide',
  {
    variants: {
      variant: {
        new: 'bg-brand text-dark-gray border-transparent shadow-lg shadow-white/20 hover:shadow-brand/60',
        features:
          'bg-[#00BFFF] text-dark-gray border-transparent shadow-lg shadow-[#00BFFF]/40 hover:shadow-[#00BFFF]/60',
        sale: 'bg-[#bebebe] text-dark-gray border-transparent shadow-lg shadow-[#cdcdcd]/40 hover:shadow-[#dedede]/60',
        limited:
          'bg-[#CDFF00] text-dark-gray border-dark-gray/50 shadow-lg shadow-[#CDFF00]/40 hover:shadow-[#CDFF00]/60',
        default:
          'border-transparent bg-primary text-dark-gray [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-dark-gray [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-dark-gray text-light-gray [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

function Badge({
  size,
  variant,
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot='badge'
      className={cn(badgeVariants({variant, size}), className)}
      {...props}
    />
  )
}

const HyperBadge = ({
  size,
  variant,
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {asChild?: boolean}) => {
  const Comp = asChild ? Slot : 'span'
  return (
    <Comp
      data-slot='badge'
      className={cn(
        'uppercase text-xl',
        badgeVariants({variant, size}),
        className,
      )}
      {...props}>
      {variant}
    </Comp>
  )
}

export {Badge, badgeVariants, HyperBadge}
