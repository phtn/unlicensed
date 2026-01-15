'use client'

import type {StoreCategory, StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptCategory, adaptProduct} from '@/lib/convexClient'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
import {SectionHeader} from '../ui/section-header'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
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
        .slice(0, 6),
    }))
    .filter((section) => section.items.length > 0)

export const CartCollection = () => {
  const {addItem} = useCart()

  // Fetch categories and products
  const categoriesQuery = useQuery(api.categories.q.listCategories, {})
  const productsQuery = useQuery(api.products.q.listProducts, {})

  const categories = useMemo(
    () => categoriesQuery?.map(adaptCategory) ?? [],
    [categoriesQuery],
  )
  const products = useMemo(
    () => productsQuery?.map(adaptProduct) ?? [],
    [productsQuery],
  )

  // Get all image IDs from products
  const imageIds = useMemo(
    () => products.map((p) => p.image).filter(Boolean),
    [products],
  )

  // Resolve URLs for all images
  const resolveUrl = useStorageUrls(imageIds)

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return products.map((product) => {
      if (!product.image) {
        return product
      }
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

  const handleAddToCart = async (productId: Id<'products'>) => {
    await addItem(productId, 1)
  }

  if (collections.length === 0) return null

  return (
    <div className='flex flex-col gap-6 py-6 border-t border-foreground/5 w-full max-h-36'>
      <h2 className='font-polysans font-semibold text-3xl'>Fire Collection</h2>
      {collections.map(({category, items}, index) => (
        <div
          key={category.slug}
          className='space-y-3 animate-in fade-in slide-in-from-bottom-4'
          style={{
            animationDelay: `${(index + 1) * 100}ms`,
            animationDuration: '500ms',
          }}>
          <SectionHeader
            title={category.name}
            className='px-4 w-md capitalize'
          />
          <div className='flex overflow-x-auto px-4 gap-3 pb-4 snap-x snap-mandatory scroll-smooth hide-scrollbar -mx-4 md:mx-0'>
            {items
              .filter((product) => product._id)
              .map((product) => (
                <CollectionItem
                  key={product._id}
                  product={product}
                  imageUrl={product.image ?? ''}
                  onAdd={() => {
                    if (product._id) {
                      handleAddToCart(product._id)
                    }
                  }}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const CollectionItem = ({
  product,
  imageUrl,
  onAdd,
}: {
  product: StoreProduct
  imageUrl: string
  onAdd: VoidFunction
}) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      onAdd()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className='snap-start bg-surface-highlight/50 rounded-2xl overflow-hidden border border-foreground/5 flex flex-col group hover:border-foreground/10 transition-colors md:max-w-sm aspect-square shrink-0'>
      <div className='relative w-full bg-white/5 aspect-square'>
        <Image
          src={imageUrl || '/default-product-image.svg'}
          alt={product.name}
          className='w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity'
        />
      </div>
      <div className='p-3 flex flex-col flex-1 gap-2'>
        <div className='flex items-center justify-between'>
          <h4 className='font-space font-medium leading-tight line-clamp-2 tracking-tight'>
            {product.name}
          </h4>
          <p className='font-space font-semibold'>
            ${formatPrice(product.priceCents)}
          </p>
        </div>
        <Button
          size='sm'
          variant='flat'
          className='w-full h-8 min-h-0 text-xs font-semibold font-space bg-foreground/5 hover:bg-foreground/10'
          isLoading={isAdding}
          onPress={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  )
}
