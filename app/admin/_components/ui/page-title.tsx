import {type ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {type ReactNode} from 'react'

interface PageTitleProps {
  className?: ClassName
  children?: ReactNode
}

export const PageTitle = ({children, className}: PageTitleProps) => {
  return (
    <h1
      className={cn(
        'group-hover:underline capitalize underline-offset-4 decoration-dotted decoration-[0.5px] decoration-foreground/60 opacity-70 tracking-tight font-polysans font-normal text-base md:text-lg xl:text-xl',
        className,
      )}>
      {children}
    </h1>
  )
}
