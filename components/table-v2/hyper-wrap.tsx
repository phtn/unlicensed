import {type ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Card} from '@heroui/react'
import {type HTMLAttributes, ReactNode} from 'react'

interface HyperCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className: ClassName
  light?: boolean
}

export const HyperWrap = ({children, className}: HyperCardProps) => {
  return (
    <Card
      className={cn(
        'relative p-0 md:rounded-sm',
        'group bg-background dark:bg-sidebar/50 overflow-hidden',
        'border border-dark-table/0 dark:border-zinc-700',
        className,
      )}>
      {children}
    </Card>
  )
}
