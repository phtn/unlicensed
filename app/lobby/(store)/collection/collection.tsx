import {StoreCategory, StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {Button} from '@/lib/heroui'
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
        .slice(0, 4),
    }))
    .filter((section) => section.items.length > 0)

export const FullCollection = ({products, categories}: CollectionProps) => {
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
  const collections = useMemo(
    () => buildCategoryCollections(categories, products),
    [categories, products],
  )

  return (
    <section
      id='collection'
      className='pt-24 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 bg-background'
    >
      <div className='flex flex-col gap-20'>
        <div className='hidden _flex flex-wrap items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h2 className='text-3xl font-polysans font-semibold tracking-tight sm:text-5xl'>
              Fire Collection
            </h2>
          </div>
          <Button
            as='a'
            href='#finder'
            radius='full'
            variant='tertiary'
            className='border border-(--surface-outline) bg-(--surface-highlight) text-sm font-semibold text-foreground transition hover:bg-(--surface-muted)'
          >
            Personalize with Strain Finder
          </Button>
        </div>
        {collections.map(({category, items}) => (
          <section
            key={category.slug}
            id={`category-${category.slug}`}
            className='mx-auto w-full max-w-7xl'
          >
            <div className='flex flex-col gap-8 rounded-3xl transition-colors'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h3 className='capitalize text-xl font-bone text-foreground sm:text-3xl'>
                    {category.name}
                  </h3>
                </div>
                <div className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted'>
                  <span>Curated selection</span>
                  <span className='h-px w-10 bg-foreground/30' />
                  <span>{items.length} picks</span>
                </div>
              </div>
              <div className='flex space-x-4 w-screen overflow-scroll sm:w-full sm:grid sm:gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {items.map((product) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    imageUrl={resolveProductImage(product.image, resolveUrl)}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
