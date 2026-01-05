import {StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Button} from '@heroui/react'
import Link from 'next/link'
import {useMemo} from 'react'

interface RelatedProductsProps {
  products: Array<StoreProduct>
}
export const RelatedProducts = ({products}: RelatedProductsProps) => {
  const imageIds = useMemo(() => products.map((p) => p.image), [products])

  // Resolve URLs for all images
  const resolveUrl = useStorageUrls(imageIds)

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return products.map((product) => {
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
  }, [products, resolveUrl])

  return (
    <section
      id='related-selections'
      className='mx-auto w-full max-w-6xl px-4 md:px-0'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
        <div>
          <h2 className='text-2xl font-bone text-foreground sm:text-3xl'>
            Related Selections
          </h2>
          <p className='text-xs sm:text-sm text-color-muted mt-1'>
            More from the {products[0]?.categorySlug} family curated for you.
          </p>
        </div>
        <Button
          as={Link}
          href={`/#category-${products[0].categorySlug}`}
          radius='full'
          variant='faded'
          size='sm'
          className='self-start sm:self-auto border border-color-border/70 bg-background/30 text-xs sm:text-sm font-semibold text-foreground/80'>
          Explore category
        </Button>
      </div>
      <div className='mt-6 sm:mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {productsWithImages.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  )
}
