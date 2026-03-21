import {StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {Icon} from '@/lib/icons'
import Link from 'next/link'

type RelatedProductCard = {
  product: StoreProduct
  imageUrl?: string
}

interface RelatedProductsProps {
  products: RelatedProductCard[]
}
export const RelatedProducts = ({products}: RelatedProductsProps) => {
  const visibleProducts = products.filter(
    ({product}) => product.available && !product.archived,
  )
  const categorySlug = visibleProducts[0]?.product.categorySlug

  if (visibleProducts.length === 0) {
    return null
  }

  return (
    <section
      id='related-selections'
      className='mx-auto w-full max-w-7xl space-y-4 px-px md:px-0 [content-visibility:auto] [contain-intrinsic-size:52rem]'>
      <div className='px-4 md:pl-0 flex flex-row items-center justify-between'>
        <div>
          <h2 className='text-2xl font-clash font-bold text-foreground sm:text-3xl'>
            Related Selections
          </h2>
        </div>
        {categorySlug ? (
          <Link
            href={`/lobby/category/${categorySlug}`}
            className='group flex items-center space-x-0.5 bg-background/30 text-sm capitalize'>
            <span>View {categorySlug}</span>
            <Icon
              name='chevron-right'
              className='size-3.5 text-foreground/80 group-hover:text-light-brand'
            />
          </Link>
        ) : null}
      </div>
      <div className='w-full py-6'>
        <div className='grid grid-cols-2 gap-1 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-fr'>
          {visibleProducts.map(({product, imageUrl}) => (
            <ProductCard
              key={product._id}
              product={product}
              imageUrl={imageUrl}
              className='h-full! min-w-0! max-w-none! w-full'
            />
          ))}
        </div>
      </div>
    </section>
  )
}
