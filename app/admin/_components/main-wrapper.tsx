import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {ReactNode, type PropsWithChildren} from 'react'

interface MainWrapperProps extends PropsWithChildren {
  children?: ReactNode
  className?: ClassName
}

export const MainWrapper = ({children, className}: MainWrapperProps) => {
  return (
    <div className={cn('md:px-4 border-t-[0.33px] border-sidebar', className)}>
      {children}
    </div>
  )
}
