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
        'relative shadow-none h-[calc(100lvh-100px)]',
        'group p-0 dark:bg-sidebar/20',
        'border-x border-dark-gray/15 dark:border-zinc-800',
        'inset-shadow-[0_1px_rgb(55_55_55/0.10)]',
        'dark:inset-shadow-[0_1px_rgb(255_255_255/0.10)]',
        className,
      )}>
      {children}
    </Card>
  )
}
