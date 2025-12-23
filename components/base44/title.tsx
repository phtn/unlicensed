interface TitleProps {
  title: string
  subtitle: string
}

export const Title = ({title, subtitle}: TitleProps) => {
  return (
    <h2 className='flex flex-col tracking-tighter font-space leading-tight mb-8'>
      <span className='capitalize font-fugaz text-3xl md:text-5xl lg:text-6xl'>
        {title}
      </span>
      <span className='text-gray-400 text-2xl md:text-3xl lg:text-4xl'>
        {subtitle}
      </span>
    </h2>
  )
}
