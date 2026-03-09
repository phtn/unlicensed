import {StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {useMemo} from 'react'

interface FeaturedProductsProps {
  featuredProducts: StoreProduct[]
}

export const FeaturedProducts = ({featuredProducts}: FeaturedProductsProps) => {
  // Get all image IDs from products (only storageIds, not URLs or null)
  const imageIds = useMemo(
    () => featuredProducts.map((p) => p.image),
    [featuredProducts],
  )

  // Resolve URLs for all images
  const resolveUrl = useStorageUrls(imageIds)

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return featuredProducts.map((product) => {
      if (!product.image) {
        return product
      }
      // Otherwise, resolve the storageId to a URL
      const resolvedUrl = resolveUrl(product.image)
      return {
        ...product,
        image: resolvedUrl,
      }
    })
  }, [featuredProducts, resolveUrl])

  return (
    <section
      id='featured'
      className='mx-auto w-full md:max-w-7xl pt-6 px-2 sm:px-4 md:px-6 lg:px-4 bg-background'>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-wrap items-center justify-between gap-4 relative'>
          <div className='space-y-1'>
            <h2 className='text-3xl font-clash font-semibold sm:text-4xl'>
              Featured <span className='text-brand'>Drops</span>
            </h2>
            <p className='text-sm opacity-80'>
              Small-batch, handpicked releases by our team.
            </p>
          </div>
        </div>
        <div className='relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8'>
          {productsWithImages.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
