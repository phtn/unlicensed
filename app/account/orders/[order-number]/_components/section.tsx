import {ReactNode} from 'react'

export const SectionTitle = ({title}: {title: ReactNode}) => {
  return (
    <h2 className='text-xl tracking-wide font-polysans font-semibold mb-4'>
      {title}
    </h2>
  )
}

export const Section = ({children}: {children: ReactNode}) => {
  return (
    <h2 className='text-xl tracking-wide font-polysans font-semibold mb-4'>
      {children}
    </h2>
  )
}
