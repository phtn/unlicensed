import {type ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Card} from '@heroui/react'
import {type HTMLAttributes, ReactNode} from 'react'

interface HyperCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className: ClassName
  light?: boolean
}

export const HyperWrap = ({
  children,
  className,
  light = false,
}: HyperCardProps) => {
  return (
    <Card
      shadow='none'
      radius='none'
      className={cn(
        'shadow-none relative overflow-hidden w-full group p-0',
        'dark:bg-dark-table/40 dark:border-zinc-700',
        'dark:inset-shadow-[0_1px_rgb(255_255_255/0.20)]',
        className,
      )}>
      {children}
    </Card>
  )
}
