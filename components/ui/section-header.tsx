import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {ReactNode, ViewTransition} from 'react'
import {Typewrite} from '../expermtl/typewrite'

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
      className={cn('flex w-full min-w-0 flex-col justify-center', className)}
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
          <div className='w-full min-w-0 break-words text-lg font-clash md:text-xl md:font-medium'>
            {title}
          </div>
          <ViewTransition>
            {children && <div className='min-w-0 flex-1'>{children}</div>}
          </ViewTransition>
        </div>
      )}
      <ViewTransition>
        {description && (
          <Typewrite
            text={description as string}
            speed={2}
            showCursor={false}
            className='w-full max-w-full overflow-hidden whitespace-normal break-words text-left text-sm text-foreground/60 md:whitespace-nowrap'
          ></Typewrite>
        )}
      </ViewTransition>
    </div>
  )
}
