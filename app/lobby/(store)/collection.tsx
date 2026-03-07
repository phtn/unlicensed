import {StoreCategory, StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {useMemo} from 'react'

interface CollectionProps {
  products: StoreProduct[]
  categories: StoreCategory[]
}

const buildCategoryCollections = (
  categories: StoreCategory[],
  products: StoreProduct[],
) =>
  categories
    .map((category) => ({
      category,
      items: products
        .filter((product) => product.categorySlug === category.slug)
        .slice(0, 10),
    }))
    .filter((section) => section.items.length > 0)

export const FullCollection = ({products, categories}: CollectionProps) => {
  // Get all image IDs from products (only storageIds, not URLs or null)
  const imageIds = useMemo(() => products?.map((p) => p.image), [products])

  // Resolve URLs for all images
  const resolveUrl = useStorageUrls(imageIds)

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return products?.map((product) => {
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
  const collections = useMemo(
    () => buildCategoryCollections(categories, productsWithImages),
    [categories, productsWithImages],
  )

  return (
    <section
      id='collection'
      className='mx-auto w-full translate-y-8 sm:translate-y-0 lg:-translate-y-1/4 pt-12 md:max-w-7xl px-2 sm:px-4 md:px-6 xl:px-0 bg-background'>
      <div className='flex flex-col gap-20'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h2 className='text-3xl font-polysans font-semibold tracking-tight sm:text-5xl'>
              <span className='text-brand'>Fire</span> Collection
            </h2>
          </div>
        </div>
        {collections.map(({category, items}) => (
          <section
            key={category.slug}
            id={`category-${category.slug}`}
            className='mx-auto w-full max-w-7xl'>
            <div className='flex flex-col gap-8 rounded-3xl transition-colors'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h3 className='capitalize text-xl font-clash text-foreground sm:text-3xl'>
                    {category.name}
                  </h3>
                </div>
                <div className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted'>
                  <span>Curated selection</span>
                  <span className='h-px w-10 bg-foreground/30' />
                  <span>{items.length} picks</span>
                </div>
              </div>
              <div className='flex space-x-3 pe-4 w-screen overflow-x-scroll md:pe-0 md:w-full md:grid-cols-5 md:gap-4'>
                {items.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
