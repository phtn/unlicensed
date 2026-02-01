import {cn} from '@/lib/utils'
import {Tooltip} from '@heroui/react'
import {ReactNode} from 'react'

interface HeaderProps {
  tip: ReactNode
  symbol?: ReactNode
  left?: boolean
  center?: boolean
  right?: boolean
}

export const ColHeader = ({
  tip,
  symbol,
  left = true,
  center = false,
  right = false,
}: HeaderProps) => (
  <Tooltip content={tip} className='font-brk font-normal text-sm' offset={2}>
    <div
      className={cn('w-full', {
        'text-left': left,
        'text-center': center,
        'text-right': right,
      })}>
      {symbol}
    </div>
  </Tooltip>
)
