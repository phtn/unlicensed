import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Button} from '@heroui/react'
import {useMemo} from 'react'
import {StoreProduct} from '../types'

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
      className='mx-auto w-full md:max-w-7xl md:pt-16 lg:pt-24 px-4 sm:px-6 lg:px-8 bg-background'>
      <div className='flex flex-col gap-10'>
        <div className='flex flex-wrap items-center justify-between gap-4 relative'>
          <div className='space-y-1'>
            <h2 className='text-3xl font-bone tracking-tight sm:text-4xl'>
              Featured Drops
            </h2>
            <p className='text-sm opacity-80'>
              Small-batch, handpicked fine releases by our team.
            </p>
          </div>

          <Button
            as='a'
            href='#finder'
            radius='full'
            variant='flat'
            className='hidden lg:flex border border-(--surface-outline) bg-(--surface-highlight) text-sm font-semibold text-foreground transition hover:bg-(--surface-muted)'>
            Personalize with Strain Finder
          </Button>
        </div>
        <div className='relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {productsWithImages.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
