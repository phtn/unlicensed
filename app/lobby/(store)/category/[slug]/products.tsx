import {StoreProduct} from '@/app/types'
import {EmptyCategory} from '@/components/store/empty-category'
import {ProductCard} from '@/components/store/product-card'
import {Activity} from 'react'

interface ProductsProps {
  products: StoreProduct[]
  getImageUrl: (image: string | null | undefined) => string | undefined
}
export const Products = ({products, getImageUrl}: ProductsProps) => {
  return (
    <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
      <div className='max-w-7xl mx-auto'>
        <Activity mode={products.length === 0 ? 'visible' : 'hidden'}>
          <EmptyCategory />
        </Activity>

        <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-fr'>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              imageUrl={getImageUrl(product.image)}
              className='!h-full !min-w-0 !max-w-none w-full'
            />
          ))}
        </div>
      </div>
    </section>
  )
}
