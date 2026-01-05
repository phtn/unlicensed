import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {ReactNode} from 'react'

interface TitleProps {
  title: ReactNode
  subtitle?: ReactNode
  titleStyle?: ClassName
}

export const Title = ({title, subtitle, titleStyle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter leading-tight md:mb-8'>
      <span
        className={cn(
          'capitalize font-polysans font-bold text-3xl md:text-5xl lg:text-6xl',
          titleStyle,
        )}>
        {title}
      </span>
      <span className='relative flex font-polysans font-normal text-muted-foreground text-lg sm:text-xl md:text-2xl lg:text-3xl'>
        {subtitle}
      </span>
    </h2>
  )
}
