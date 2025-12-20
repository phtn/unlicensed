import {type PropsWithChildren} from 'react'

export const MainWrapper = ({children}: PropsWithChildren) => {
  return <div className='px-4 border-t-[0.33px] border-sidebar'>{children}</div>
}
