import {ReactNode} from 'react'

interface TitleProps {
  title: ReactNode
  subtitle: string
}

export const Title = ({title, subtitle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter leading-tight md:mb-8'>
      <span className='capitalize font-polysans font-bold text-3xl md:text-5xl lg:text-6xl'>
        {title}
      </span>
      <span className='flex font-polysans font-normal opacity-60 text-xl sm:text-2xl md:text-3xl lg:text-3xl'>
        {subtitle}
      </span>
    </h2>
  )
}
