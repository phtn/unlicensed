import {ReactNode} from 'react'

export const Tag = ({text}: {text: ReactNode}) => {
  return (
    <div className='text-xs opacity-60 font-clash font-medium tracking-wider uppercase mb-8'>
      {text}
    </div>
  )
}
