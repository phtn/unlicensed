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
      shadow='none'
      radius='none'
      className={cn(
        'relative p-0 inset-0 h-[calc(100lvh-100px)]',
        'group bg-gray-50 dark:bg-sidebar/50',
        'border border-dark-table/0 dark:border-zinc-700',
        className,
      )}>
      {children}
    </Card>
  )
}
