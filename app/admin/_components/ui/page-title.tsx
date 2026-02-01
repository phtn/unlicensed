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
        'underline leading-none capitalize underline-offset-4 decoration-[0.33px] decoration-dotted decoration-foreground/0 md:decoration-foreground/30 dark:decoration-foreground/20 md:group-hover:decoration-foreground/80 opacity-80 tracking-tighter md:tracking-tight font-polysans font-normal text-xl xl:text-xl',
        className,
      )}>
      {children}
    </div>
  )
}
