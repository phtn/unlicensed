import {PropsWithChildren} from 'react'

const ProductLayout = async ({children}: PropsWithChildren) => (
  <div className='md:px-2 border-t-[0.33px] border-sidebar'>{children}</div>
)
export default ProductLayout
