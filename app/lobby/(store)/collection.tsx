import {StoreCategory, StoreProduct} from '@/app/types'
import {ProductCard} from '@/components/store/product-card'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import Link from 'next/link'
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
    .map((category) => {
      const categoryProducts = products.filter(
        (product) => product.categorySlug === category.slug,
      )

      return {
        category,
        items: categoryProducts.slice(0, 10),
        totalCount: categoryProducts.length,
      }
    })
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
      className='mx-auto w-full pt-16 md:max-w-7xl px-2 sm:px-4 md:px-6 xl:px-0 bg-background'
    >
      <div className='flex flex-col gap-20'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h2 className='text-3xl font-clash font-semibold tracking-tight sm:text-5xl'>
              <span className='text-brand'>Fire</span> Collection
            </h2>
          </div>
        </div>
        {collections.map(({category, items, totalCount}) => (
          <section
            key={category.slug}
            id={`category-${category.slug}`}
            className='mx-auto w-full max-w-7xl'
          >
            <div className='flex flex-col gap-8 rounded-3xl transition-colors'>
              <div className='flex gap-4 items-center justify-between'>
                <div>
                  <h3 className='capitalize text-xl font-clash text-foreground sm:text-3xl'>
                    {category.name}
                  </h3>
                </div>
                <Link
                  href={`/lobby/category/${category.slug}`}
                  className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted transition-opacity hover:opacity-70'
                >
                  <span>View all</span>
                  <span className='h-px w-10 bg-foreground/30' />
                  <span>{totalCount}</span>
                </Link>
              </div>
              <div className='flex space-x-3 pe-4 w-screen overflow-x-scroll md:pe-0 md:w-full md:grid-cols-5 md:gap-4'>
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
