import {ClassName} from '@/app/types'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ReactNode} from 'react'

interface SqrconProps {
  id: string
  icon?: IconName
  label?: string
  style?: ClassName
  base?: ClassName
  children?: ReactNode
}

export const Sqrcon = ({
  id,
  label,
  icon,
  children,
  base,
  style,
}: SqrconProps) => {
  const handleClick = () => {
    console.log(`Clicked on ${label}`)
  }
  return (
    <div id={id} className='flex items-start justify-center size-16 w-full'>
      <div className='relative aspect-square h-1/2'>
        <div className='relative flex items-center justify-center'>
          <Icon
            name='sqrc'
            onClick={handleClick}
            className={cn(
              'size-16 drop-shadow-xs md:drop-shadow-sm active:scale-95 transition-transform duration-300 ease-in-out cursor-pointer',
              base,
            )}
          />
          <div className='pointer-events-none absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2'>
            {icon && (
              <Icon name={icon} className={cn('size-8 md:size-8', style)} />
            )}
            {children}
          </div>
        </div>
        <div className='text-xs md:text-sm flex justify-center tracking-tight select-none opacity-80'>
          {label}
        </div>
      </div>
    </div>
  )
}

export const SqrconDemo = ({icon}: {icon?: IconName}) => (
  <Sqrcon
    id='demo'
    icon={icon ?? 'airplane-takeoff'}
    label='demo'
    style='text-blue-500'
    base='text-white'
  />
)
