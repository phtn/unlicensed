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
        'underline leading-none capitalize underline-offset-4 decoration-dotted decoration-[0.5px] md:decoration-foreground/0 decoration-foreground/50 dark:decoration-foreground/20 md:group-hover:decoration-foreground/60 opacity-80 tracking-tighter md:tracking-tight font-polysans font-normal text-xl xl:text-xl',
        className,
      )}>
      {children}
    </div>
  )
}
