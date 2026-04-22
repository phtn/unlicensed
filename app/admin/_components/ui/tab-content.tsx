import {ClassName} from '@/app/types'
import {ScrollArea} from '@/components/ui/scroll-area'
import {cn} from '@/lib/utils'
import {ReactNode} from 'react'

interface TabContentContainerProps {
  title: string
  description?: ReactNode
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
        'w-full min-w-0 bg-linear-to-br from-sidebar to-slate-200/10 dark:from-slate-400/10 dark:to-slate-600/5 p-3 md:p-4 rounded-md',
        className,
      )}
    >
      {/* Header */}
      <header className='flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div className='min-w-0 space-y-1'>
          <div className='w-full break-words text-lg tracking-tight font-polysans md:font-medium'>
            {title}
          </div>

          {description && (
            <p className='max-w-xl break-words text-sm text-default-500'>
              {description}
            </p>
          )}
        </div>
        <div className='min-w-0'>{extraHeader}</div>
      </header>
      <ScrollArea>{children}</ScrollArea>
    </div>
  )
}
