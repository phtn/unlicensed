'use client'

import {ClassName} from '@/app/types'
import {Button} from '@/components/ui/button'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'

interface QuickScrollProps {
  href?: string
  className?: ClassName
}

export const QuickScroll = ({href, className}: QuickScrollProps) => {
  const icon = (
    <Icon name='arrow-down' className='hidden lg:flex size-5 text-black' />
  )

  return (
    <div
      className={cn(
        'flex justify-end px-6 py-2.5 overflow-x-hidden bg-transparent border-b-[0.33px] border-dotted border-foreground/10',
        className,
      )}>
      <div className='max-w-7xl w-full flex justify-end mx-auto'>
        {href ? (
          <Button
            asChild
            size='icon-xs'
            variant='ghost'
            className='size-7 rounded-full bg-transparent hover:bg-transparent hover:text-teal-600'>
            <a aria-label='Scroll' href={href}>
              {icon}
            </a>
          </Button>
        ) : (
          <Button
            type='button'
            size='icon-xs'
            variant='ghost'
            aria-label='Scroll'
            className='size-7 rounded-full bg-transparent hover:bg-transparent hover:text-teal-600'>
            {icon}
          </Button>
        )}
      </div>
    </div>
  )
}
