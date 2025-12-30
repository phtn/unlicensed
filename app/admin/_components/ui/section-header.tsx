import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {ReactNode, ViewTransition} from 'react'

interface SectionHeaderProps {
  title?: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: ClassName
}
export const SectionHeader = ({
  title,
  description,
  children,
  className,
}: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-start justify-center w-full',
        className,
      )}>
      {title && (
        <div
          className={cn('flex items-center justify-between w-full', {
            ' space-x-4': children,
          })}>
          <div className=' text-xl tracking-tight md:tracking-normal font-polysans md:font-medium w-full'>
            {title}
          </div>
          <ViewTransition>
            {children && <div className='flex-1'>{children}</div>}
          </ViewTransition>
        </div>
      )}
      <ViewTransition>
        {description && (
          <p className='text-sm text-foreground/60'>{description}</p>
        )}
      </ViewTransition>
    </div>
  )
}
