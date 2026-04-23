import {PropsWithChildren} from 'react'

export const SectionTitle = ({children}: PropsWithChildren) => {
  return (
    <h3 className='font-polysans-wide font-medium text-sm md:text-lg block'>
      <span className='opacity-40 mr-1'>⏹</span> {children}
    </h3>
  )
}
