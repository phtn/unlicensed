import {ReactNode} from 'react'

export const StatCard = ({title, value}: {title: string; value: ReactNode}) => {
  return (
    <div className='rounded-md bg-background dark:bg-background/40 p-2'>
      <p className='text-[8px] font-ios uppercase tracking-[0.22em] text-foreground/45'>
        {title}
      </p>
      <p className='font-clash text-lg font-semibold text-foreground/80'>
        {value}
      </p>
    </div>
  )
}
