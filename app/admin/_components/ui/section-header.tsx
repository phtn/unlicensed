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
      )}
    >
      {title && (
        <div
          className={cn(
            'flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between',
            {
              'md:space-x-4': children,
            },
          )}
        >
          <div className='w-full min-w-0 break-words text-lg md:tracking-normal font-clash md:font-medium capitalize'>
            {title}
          </div>
          <ViewTransition>
            {children && <div className='min-w-0 flex-1'>{children}</div>}
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
