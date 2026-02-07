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
          'font-polysans font-bold text-3xl md:text-5xl lg:text-6xl line-clamp-2 capitalize',
          titleStyle,
        )}>
        {title}
      </div>
      <span className='relative flex font-polysans font-normal text-muted-foreground text-lg sm:text-xl md:text-2xl lg:text-3xl capitalize'>
        {subtitle}
      </span>
    </h2>
  )
}

export const TitleV2 = ({title, subtitle, titleStyle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter leading-tight md:mb-8'>
      <div className='relative flex font-bone text-foreground text-3xl sm:text-2xl md:text-3xl '>
        {subtitle}
      </div>
      <div
        className={cn(
          'capitalize font-polysans font-black text-5xl md:text-7xl lg:text-7xl text-brand',
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
          'font-polysans font-bold text-3xl md:text-5xl lg:text-6xl line-clamp-2 w-fit',
          titleStyle,
        )}>
        {title}
      </div>
      <ElectricBorder
        chaos={18}
        thickness={2}
        speed={0.5}
        className='bg-transparent absolute -top-4 h-px scale-x-110 w-100 opacity-90 translate-x-8'
        color='#FFF'
      />
      <span className='relative flex font-polysans font-normal text-muted-foreground text-lg sm:text-xl md:text-2xl lg:text-3xl'>
        {subtitle}
      </span>
    </h2>
  )
}
