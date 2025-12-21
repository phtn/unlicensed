import {PropsWithChildren} from 'react'

const CategoryLayout = async ({children}: PropsWithChildren) => (
  <div className='px-4 border-t-[0.33px] border-sidebar'>{children}</div>
)
export default CategoryLayout
