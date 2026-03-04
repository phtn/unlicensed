import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {ReactNode} from 'react'

interface TabContentContainerProps {
  title: string
  description?: string
  children?: ReactNode
  className?: ClassName
  extraHeader?: ReactNode
}

export const TabContentContainer = ({
  title,
  description,
  children,
  className,
  extraHeader,
}: TabContentContainerProps) => {
  return (
    <div
      className={cn(
        'w-full bg-linear-to-br from-sidebar to-slate-200/10 dark:from-slate-400/10 dark:to-slate-600/5 p-4 rounded-md',
        className,
      )}>
      {/* Header */}
      <header className='flex items-start justify-between'>
        <div className='space-y-1'>
          <h1 className='font-okxs text-xl tracking-tight text-foreground'>
            {title}
          </h1>
          {description && (
            <p className='max-w-xl text-sm text-default-500'>{description}</p>
          )}
        </div>
        <div>{extraHeader}</div>
      </header>
      {children}
    </div>
  )
}
