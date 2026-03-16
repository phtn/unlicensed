import {StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {useCallback, useMemo} from 'react'

interface RelatedProductsProps {
  products: Array<StoreProduct>
}
export const RelatedProducts = ({products}: RelatedProductsProps) => {
  const imageIds = useMemo(
    () =>
      products
        .filter(
          (product) => !!product.image && !product.image.startsWith('http'),
        )
        .map((product) => product.image),
    [products],
  )
  const resolveUrl = useStorageUrls(imageIds)
  const getImageUrl = useCallback(
    (image: string | null | undefined) =>
      resolveProductImage(image, resolveUrl),
    [resolveUrl],
  )

  return (
    <section
      id='related-selections'
      className='mx-auto w-full max-w-7xl space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
        <div>
          <h2 className='text-2xl font-clash font-bold text-foreground sm:text-3xl'>
            Related Selections
          </h2>
        </div>
        <Button
          as={Link}
          href={`/category/${products[0].categorySlug}`}
          radius='full'
          variant='faded'
          size='sm'
          className='self-start sm:self-auto border border-color-border/70 bg-background/30 text-xs sm:text-sm text-foreground/80 capitalize'>
          View {products[0]?.categorySlug} Category
        </Button>
      </div>
      <div className='w-full py-6 px-4 md:px-0'>
        <div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-fr'>
          {products
            .filter((product) => !product.archived)
            .map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                imageUrl={getImageUrl(product.image)}
                className='h-full! min-w-0! max-w-none! w-full'
              />
            ))}
        </div>
      </div>
    </section>
  )
}
