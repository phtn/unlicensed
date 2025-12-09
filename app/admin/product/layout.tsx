import {PropsWithChildren} from 'react'

const ProductLayout = async ({children}: PropsWithChildren) => (
  <div className='px-3'>{children}</div>
)
export default ProductLayout
