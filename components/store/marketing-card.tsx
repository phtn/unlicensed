import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'

import {ComponentProps, ReactNode} from 'react'

interface MarkSectionProps {
  title: string
  description: string
  children?: ReactNode
}

export const MarkSection = ({
  title,
  description,
  children,
}: MarkSectionProps) => {
  return (
    <div className='relative z-100 bg-white dark:bg-black w-screen h-full'>
      <div className='flex flex-col justify-center max-w-7xl mx-auto h-102'>
        <h2 className='font-clash font-medium text-4xl md:text-4xl lg:text-5xl text-center md:whitespace-nowrap max-w-[14ch] md:max-w-full'>
          {title}
        </h2>
        <p className='mt-4 text-balance text-center text-muted-foreground text-sm md:text-base'>
          {description}
        </p>
      </div>
      <div className='overflow-hidden bg-white dark:bg-black h-72 md:h-96'>
        {children}
      </div>
    </div>
  )
}

type FeatureType = {
  title: string
  icon: IconName
  description: string
}
export function FeatureCard({
  feature,
  className,
  ...props
}: ComponentProps<'div'> & {
  feature: FeatureType
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-linear-to-r from-background/90 via-background/80 to-alum/5 p-6',
        className,
      )}
      {...props}>
      <Icon
        name={feature.icon}
        aria-hidden
        className='size-6 text-foreground/75'
        strokeWidth={1}
      />
      <h3 className='mt-10 text-sm md:text-base'>{feature.title}</h3>
      <p className='relative z-20 mt-2 font-light opacity-70 text-xs'>
        {feature.description}
      </p>
    </div>
  )
}
