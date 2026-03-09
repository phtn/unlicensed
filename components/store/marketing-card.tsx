import {ReactNode} from 'react'

interface MarkSectionProps {
  title: string
  description: string
  children?: ReactNode
}

export const MarkSection = ({
  title,
  description,
  children,
}: MarkSectionProps) => {
  return (
    <div className='relative z-100 bg-white dark:bg-black w-screen h-full'>
      <div className='flex min-h-64 flex-col justify-center px-4 py-12 max-w-7xl mx-auto md:h-102 md:px-0 md:py-0'>
        <h2 className='font-clash font-medium text-4xl md:text-4xl lg:text-5xl mx-auto text-center md:whitespace-nowrap max-w-[14ch] md:max-w-full'>
          {title}
        </h2>
        <p className='mt-4 text-balance text-center text-muted-foreground text-sm md:text-base'>
          {description}
        </p>
      </div>
      <div className='overflow-hidden bg-white dark:bg-black h-72 md:h-80'>
        {children}
      </div>
    </div>
  )
}
