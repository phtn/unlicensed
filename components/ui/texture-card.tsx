import {cn} from '@/lib/utils'
import {forwardRef, HTMLAttributes, ReactNode} from 'react'

const TextureCardStyled = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {children?: ReactNode}
>(({className, children, ...props}, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-3xl border border-white dark:border-dark-gray/50',
      'bg-linear-to-b dark:from-dark-gray/40 dark:to-dark-gray/20 from-neutral-100 to-white/70',
      className,
    )}
    {...props}>
    <div className='rounded-[23px] border  dark:border-dark-gray/75 border-light-gray/20'>
      <div className='rounded-[22px] border  dark:border-dark-gray/70 border-light-gray/25'>
        <div className='rounded-[21px] border  dark:border-dark-gray/40  border-light-gray/32'>
          {/* Inner content wrapper */}
          <div className=' w-full border border-light-gray/40 dark:border-dark-gray/10 rounded-[20px] text-neutral-500 overflow-hidden'>
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
))
TextureCardStyled.displayName = 'TextureCardStyled'

// Allows for global css overrides and theme support - similar to shad cn
const TextureCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {children?: ReactNode}
>(({className, children, ...props}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-white/60 dark:border-border/30',
        'rounded-[calc(var(--radius))]', // Base radius with fallback
        className,
      )}
      {...props}>
      <div className='border dark:border-neutral-900/80 border-black/10 rounded-[calc(var(--radius)-1px)]'>
        <div className='border dark:border-neutral-950 border-white/50 rounded-[calc(var(--radius)-2px)]'>
          <div className='border dark:border-neutral-900/70 border-neutral-950/20 rounded-[calc(var(--radius)-3px)]'>
            <div className=' w-full border border-white/50 dark:border-neutral-700/50 text-neutral-500 bg-linear-to-b from-card/70 to-secondary/50 rounded-[calc(var(--radius)-4px)] '>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

TextureCard.displayName = 'TextureCard'

const TextureCardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
  <div
    ref={ref}
    className={cn(
      'first:pt-4 first:pl-4 last:pb-4 ', // Adjust padding for first and last child
      className,
    )}
    {...props}
  />
))
TextureCardHeader.displayName = 'TextureCardHeader'

const TextureCardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({className, ...props}, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-100 pl-2',
      className,
    )}
    {...props}
  />
))
TextureCardTitle.displayName = 'TextureCardTitle'

const TextureCardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({className, ...props}, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-neutral-600 dark:text-neutral-400 pl-2',
      className,
    )}
    {...props}
  />
))
TextureCardDescription.displayName = 'TextureCardDescription'

const TextureCardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
  <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
))
TextureCardContent.displayName = 'TextureCardContent'

const TextureCardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between px-6 py-4  gap-2',

      className,
    )}
    {...props}
  />
))
TextureCardFooter.displayName = 'TextureCardFooter'

const TextureSeparator = () => {
  return (
    <div className='border border-t-neutral-50 border-b-neutral-300/50 dark:border-t-neutral-950 dark:border-b-neutral-700/50 border-l-transparent border-r-transparent' />
  )
}

export {
  TextureCard,
  TextureCardContent,
  TextureCardDescription,
  TextureCardFooter,
  TextureCardHeader,
  TextureCardStyled,
  TextureCardTitle,
  TextureSeparator,
}
