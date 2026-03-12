'use client'

import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {motion, useReducedMotion, type HTMLMotionProps} from 'motion/react'

const gridFourItems = [
  {
    eyebrow: 'Build',
    title: 'Mix and match your way',
    icon: 'grid-four',
    description:
      'Build your own ounce with eight different eighths, stack larger flower deals, or combine extracts, vapes, and edibles for flexible bulk savings.',
  },
  {
    eyebrow: 'Reward',
    title: 'Earn cash back every time you shop',
    icon: 'coins',
    description:
      'Every order earns rewards, with higher cash back rates unlocked as your order value climbs.',
  },
  {
    eyebrow: 'Deliver',
    title: 'Guaranteed delivery',
    icon: 'airplane-takeoff',
    description:
      'A more dependable ordering experience with free shipping on qualifying orders, so it is easier to stock up without second-guessing delivery.',
  },
  {
    eyebrow: 'Pay',
    title: 'A smoother way to pay',
    icon: 'credit-card-2',
    description:
      'Credit cards are accepted through a secure payment flow, giving you a smoother checkout than many cannabis retailers.',
  },
] satisfies ReadonlyArray<GridItemProps>

export const GridFour = () => {
  return (
    <section className='bg-background px-4 pb-24 md:px-6'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8 hidden _flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between'>
          <div className='max-w-2xl'>
            <p className='text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground/45'>
              Why It Lands
            </p>
            <h2 className='mt-3 max-w-[12ch] font-clash text-3xl leading-none md:text-5xl'>
              Built for bigger carts without the usual friction.
            </h2>
          </div>
          <p className='max-w-sm text-sm leading-6 text-muted-foreground md:text-right'>
            More flexibility, better rewards, reliable shipping, and a payment
            flow that feels current instead of patched together.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6'>
          {gridFourItems.map((item, index) => (
            <GridItem key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

type GridItemProps = {
  eyebrow: string
  title: string
  icon: IconName
  description: string
}
export function GridItem({
  className,
  item,
  index,
  ...props
}: HTMLMotionProps<'article'> & {
  item: GridItemProps
  index: number
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.article
      initial={shouldReduceMotion ? {opacity: 0} : {opacity: 0, y: 24}}
      whileInView={shouldReduceMotion ? {opacity: 1} : {opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.3}}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.55,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group relative isolate overflow-hidden border border-foreground/10 bg-linear-to-br from-background via-background to-foreground/2 p-6 _shadow-[0_24px_80px_-48px_rgba(0,0,0,0.5)] transition-transform duration-300',
        className,
      )}
      {...props}>
      <div className='absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand/12 blur-3xl transition-transform duration-300 group-hover:scale-125' />
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.55),transparent_42%)] opacity-70' />

      <div className='hidden relative z-10 _flex items-start justify-between gap-4'>
        <span className='hidden _inline-flex rounded-full border border-foreground/10 bg-background/80 px-3 py-1 text-[0.65rem] font-ios font-medium uppercase tracking-[0.2em] text-foreground/55 backdrop-blur-sm'>
          {item.eyebrow}
        </span>
        <span className='hidden font-ios text-xs text-foreground/30'>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className='relative z-10 md:ml-4 md:mt-4 gap-6 md:gap-12 flex items-start'>
        <div className='flex size-13 shrink-0 items-center justify-center rounded-none bg-brand text-background'>
          <Icon name={item.icon} aria-hidden className='size-6 text-white' />
        </div>
        <div>
          <h3 className='font-clash text-lg leading-tight md:text-xl'>
            {item.title}
          </h3>
          <p className='mt-3 max-w-[34ch] text-sm leading-6 text-muted-foreground'>
            {item.description}
          </p>
        </div>
      </div>
    </motion.article>
  )
}
