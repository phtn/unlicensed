import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {ReactNode} from 'react'
import {ElectricBorder} from '../expermtl/electric'

interface TitleProps {
  title: ReactNode
  subtitle?: ReactNode
  titleStyle?: ClassName
}

export const Title = ({title, subtitle, titleStyle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter leading-tight md:mb-8'>
      <div
        className={cn(
          'font-polysans font-bold text-3xl md:text-5xl lg:text-6xl line-clamp-2',
          titleStyle,
        )}>
        {title}
      </div>
      <span className='relative flex font-polysans font-normal text-muted-foreground text-lg sm:text-xl md:text-2xl lg:text-3xl'>
        {subtitle}
      </span>
    </h2>
  )
}

export const TitleV2 = ({title, subtitle, titleStyle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter leading-tight md:mb-8'>
      <div className='relative flex font-bone text-foreground text-3xl sm:text-xl md:text-2xl lg:text-5xl'>
        {subtitle}
      </div>
      <div
        className={cn(
          'capitalize font-polysans font-black text-6xl md:text-5xl lg:text-8xl text-brand',
          titleStyle,
        )}>
        {title}
      </div>
    </h2>
  )
}

export const TitleV3 = ({title, subtitle, titleStyle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter relative leading-tight md:mb-8'>
      <div
        className={cn(
          'font-polysans font-bold text-3xl md:text-5xl lg:text-6xl line-clamp-2',
          titleStyle,
        )}>
        {title}
      </div>
      <ElectricBorder
        chaos={12}
        thickness={2.5}
        speed={0.5}
        className='bg-transparent absolute -top-4 h-px scale-x-105 w-1/3 opacity-80 translate-x-3'
        color='#fb80ff'
      />
      <span className='relative flex font-polysans font-normal text-muted-foreground text-lg sm:text-xl md:text-2xl lg:text-3xl'>
        {subtitle}
      </span>
    </h2>
  )
}
