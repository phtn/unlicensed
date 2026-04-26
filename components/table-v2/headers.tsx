import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Tooltip} from '@heroui/react'
import {ReactNode} from 'react'

interface HeaderProps {
  tip: ReactNode
  symbol?: ReactNode
  left?: boolean
  center?: boolean
  right?: boolean
  className?: ClassName
}

export const ColHeader = ({
  tip,
  symbol,
  left = true,
  center = false,
  right = false,
  className,
}: HeaderProps) => (
  <Tooltip>
    <Tooltip.Content className='font-ios font-normal text-sm'>
      {tip}
    </Tooltip.Content>
    <div
      className={cn(
        'w-full',
        {
          'text-left': left,
          'text-center': center,
          'text-right': right,
        },
        className,
      )}>
      {symbol}
    </div>
  </Tooltip>
)
