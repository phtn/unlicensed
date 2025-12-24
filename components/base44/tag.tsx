import {ReactNode} from 'react'

export const Tag = ({text}: {text: ReactNode}) => {
  return (
    <div className='text-xs opacity-60 font-polysans font-normal tracking-wider uppercase mb-8'>
      {text}
    </div>
  )
}
