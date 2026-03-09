import {StoreProduct} from '@/app/types'
import {EmptyCategory} from '@/components/store/empty-category'
import {ProductCard} from '@/components/store/product-card'
import {Activity} from 'react'

interface ProductsProps {
  products: StoreProduct[]
}
export const Products = ({products}: ProductsProps) => {
  return (
    <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
      <div className='max-w-7xl mx-auto'>
        <Activity mode={products.length === 0 ? 'visible' : 'hidden'}>
          <EmptyCategory />
        </Activity>
        <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-6 w-full'>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
