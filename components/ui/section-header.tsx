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
    <div className={cn('flex flex-col justify-center w-full', className)}>
      {title && (
        <div
          className={cn('flex items-center justify-between w-full', {
            ' space-x-4': children,
          })}>
          <div className='text-lg md:text-xl font-clash md:font-medium w-full'>
            {title}
          </div>
          <ViewTransition>
            {children && <div className='flex-1'>{children}</div>}
          </ViewTransition>
        </div>
      )}
      <ViewTransition>
        {description && (
          <Typewrite
            text={description as string}
            speed={2}
            showCursor={false}
            className='text-left text-sm text-foreground/60 whitespace-nowrap w-[94lvw] overflow-scroll md:w-full'></Typewrite>
        )}
      </ViewTransition>
    </div>
  )
}
