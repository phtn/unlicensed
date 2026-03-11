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

        <div className='flex w-screen md:w-7xl overflow-x-auto gap-3 snap-x snap-mandatory scroll-smooth hide-scrollbar ml-3 pr-8'>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              imageUrl={getImageUrl(product.image)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
