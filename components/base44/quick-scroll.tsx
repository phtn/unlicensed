import {ClassName} from '@/app/types'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'

interface QuickScrollProps {
  href?: string
  className?: ClassName
}

export const QuickScroll = ({href, className}: QuickScrollProps) => {
  return (
    <div
      className={cn('flex justify-end px-6 bg-slate-300/80 py-2.5 overflow-x-hidden', className)}>
      <div className='max-w-7xl w-full flex justify-end mx-auto'>
        <Button
          isIconOnly
          href={href}
          as={href ? 'a' : 'button'}
          className='rounded-full size-7 flex items-center justify-center bg-transparent hover:bg-transparent hover:text-teal-600 transition-colors'>
          <Icon
            name='arrow-down'
            className='hidden lg:flex size-5 text-black'
          />
        </Button>
      </div>
    </div>
  )
}
