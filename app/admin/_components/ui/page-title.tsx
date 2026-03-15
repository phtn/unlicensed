import {type ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {type ReactNode} from 'react'

interface PageTitleProps {
  className?: ClassName
  children?: ReactNode
}

export const PageTitle = ({children, className}: PageTitleProps) => {
  return (
    <div
      className={cn(
        'hover:underline leading-none capitalize underline-offset-4 decoration-[0.5px] decoration-dotted md:decoration-mac-blue opacity-90 tracking-tighter md:tracking-tight font-clash font-normal text-xl xl:text-xl',
        className,
      )}>
      {children}
    </div>
  )
}
