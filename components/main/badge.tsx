import {Slot} from '@radix-ui/react-slot'
import {cva, type VariantProps} from 'class-variance-authority'
import type * as React from 'react'

import {cn} from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-black italic w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden tracking-wide',
  {
    variants: {
      variant: {
        new: 'bg-brand text-dark-gray border-transparent shadow-md shadow-pink-400/20 hover:shadow-brand/60',
        feature:
          'bg-featured text-dark-gray border-transparent shadow-lg shadow-featured/40 hover:shadow-featured/60',
        sale: 'bg-[#bebebe] text-dark-gray border-transparent shadow-lg shadow-[#cdcdcd]/40 hover:shadow-[#dedede]/60',
        limited:
          'bg-limited text-dark-gray border-dark-gray/50 shadow-lg shadow-limited/40 hover:shadow-limited/60',
        deal: 'border-[0.5px] border-white bg-deal text-white shadow-lg shadow-deal/40 [a&]:hover:bg-deal/90 focus-visible:ring-deal/20 dark:focus-visible:ring-deal/40 dark:bg-deal/60',
        secondary:
          'border-transparent bg-secondary text-dark-gray [a&]:hover:bg-secondary/90',
        rare: 'border-transparent bg-rare dark:bg-rare shadow-lg shadow-rare/40 text-white [a&]:hover:bg-rare/90 focus-visible:ring-rare/20 dark:focus-visible:ring-rare/40 dark:bg-rare/60',
        outline:
          'text-dark-gray text-light-gray [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
      size: {
        sm: 'px-3 py-1 text-xs max-h-8 tracking-wider',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
      },
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
      {props.children ?? variant}
    </Comp>
  )
}

export {Badge, badgeVariants, HyperBadge}
