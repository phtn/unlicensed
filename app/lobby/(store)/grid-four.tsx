import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ComponentProps} from 'react'

export const GridFour = () => {
  const gridfour: Array<GridItemProps> = [
    {
      title: 'Mix and Match your way',
      icon: 'rapid-fire-logo',
      description:
        'Build your own ounce wit 8 different eights, customize larger, flower deals, or mix and match extracts, vapes, and edibles for more flexible bulk savings.',
    },

    {
      title: 'Earn cash back every time you shop',
      icon: 'rapid-fire-logo',
      description:
        'Every order earns rewards, with highter cash back rates unlocked at higher order values.',
    },
    {
      title: 'Guaranteed delivery',
      icon: 'rapid-fire-logo',
      description:
        'A more dependable ordering experience you can count on with me shipping on qualifying orders make it easier to stock up efficiently.',
    },
    {
      title: 'A smoother way to pay',
      icon: 'rapid-fire-logo',
      description:
        'Credit cards accepted through our secure payment flow, giving you more convenience that many cannabis retailers.',
    },
  ]
  return (
    <div className='max-w-6xl mx-auto grid grid-cols-2 gap-8 pb-24 bg-background'>
      {gridfour.map((item) => (
        <GridItem key={item.title} item={item} />
      ))}
    </div>
  )
}

type GridItemProps = {
  title: string
  icon: IconName
  description: string
}
export function GridItem({
  className,
  item,
  ...props
}: ComponentProps<'div'> & {
  item: GridItemProps
}) {
  return (
    <div className={cn('relative overflow-hidden p-6', className)} {...props}>
      <Icon
        name={item.icon}
        aria-hidden
        className='size-8 text-foreground/40'
        strokeWidth={1}
      />
      <h3 className='mt-10 font-clash text-sm md:text-base'>{item.title}</h3>
      <p className='relative z-20 mt-2 font-light opacity-70 text-xs'>
        {item.description}
      </p>
    </div>
  )
}
