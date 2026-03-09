'use client'

import {ProductList} from '@/app/admin/(routes)/inventory/product/product-list'
import {ProductsData} from '@/app/admin/(routes)/inventory/product/products-data'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Typewrite} from '@/components/expermtl/typewrite'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, Chip, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {parseAsString, parseAsStringEnum, useQueryState} from 'nuqs'
import {Suspense} from 'react'

interface CategoryProductsContentProps {
  categorySlug: string
}

type CategoryProductView = 'cards' | 'stack' | 'table'

const CATEGORY_PRODUCT_VIEWS: Array<{
  id: CategoryProductView
  label: string
  icon: IconName
  description: string
}> = [
  {
    id: 'cards',
    label: 'Cards',
    icon: 'square-line',
    description: 'Visual browsing with image-first product tiles.',
  },
  {
    id: 'stack',
    label: 'Stack',
    icon: 'rows-2',
    description: 'Compact product rows with key inventory signals.',
  },
  {
    id: 'table',
    label: 'Table',
    icon: 'rows-3',
    description: 'Dense operational table for sorting and quick edits.',
  },
]

const getProductStock = (product: Doc<'products'>) => {
  const stockByDenomination = Object.values(product.stockByDenomination ?? {})

  if (stockByDenomination.length > 0) {
    return stockByDenomination.reduce((total, quantity) => total + quantity, 0)
  }

  return product.stock ?? null
}

const getStartingPrice = (product: Doc<'products'>) => {
  if (typeof product.priceCents === 'number') {
    return product.priceCents
  }

  const prices = Object.values(product.priceByDenomination ?? {}).filter(
    (value): value is number => typeof value === 'number',
  )

  if (prices.length === 0) {
    return null
  }

  return Math.min(...prices)
}

const ProductStackView = ({
  categorySlug,
  products,
}: {
  categorySlug: string
  products: Doc<'products'>[] | undefined
}) => {
  const imageIds =
    products?.map((product) => product.image).filter(Boolean) ?? []
  const resolveUrl = useStorageUrls(imageIds as string[])

  return (
    <section className='h-[91lvh] overflow-auto px-2 pb-10'>
      {products?.length === 0 ? (
        <p className='px-4 text-sm text-neutral-500'>
          No products in this category.
        </p>
      ) : (
        <div className='space-y-3'>
          {products?.map((product) => {
            const stock = getProductStock(product)
            const startingPrice = getStartingPrice(product)
            const metaChips = [
              product.brand?.[0],
              product.tier,
              product.productType,
              product.subcategory,
            ].filter((value): value is string => Boolean(value))

            return (
              <Card
                key={product._id}
                shadow='none'
                radius='none'
                className='overflow-hidden border border-black/5 bg-white/80 dark:border-white/10 dark:bg-dark-table/45'>
                <div className='flex flex-col md:flex-row'>
                  <div className='relative h-40 shrink-0 overflow-hidden bg-linear-to-br from-slate-200/60 to-transparent md:h-auto md:w-44 dark:from-white/6'>
                    {product.image ? (
                      <Image
                        removeWrapper
                        alt={product.name ?? 'Product image'}
                        src={resolveUrl(product.image) ?? undefined}
                        radius='none'
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.08),transparent)] text-3xl font-semibold uppercase text-slate-600 dark:text-slate-300'>
                        {(product.name ?? '?').slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className='flex flex-1 flex-col gap-4 p-4'>
                    <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                      <div className='space-y-3'>
                        <div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <h3 className='text-lg font-semibold tracking-tight text-foreground'>
                              {product.name}
                            </h3>
                            <Chip
                              size='sm'
                              variant='flat'
                              className={
                                product.available === false
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              }>
                              {product.available === false
                                ? 'Unavailable'
                                : 'Available'}
                            </Chip>
                          </div>
                          <p className='text-xs text-neutral-500'>
                            {product.slug ?? `${categorySlug}-${product._id}`}
                          </p>
                        </div>

                        <p className='max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300'>
                          {product.shortDescription?.trim() ||
                            product.description?.trim() ||
                            'No product copy added yet.'}
                        </p>

                        <div className='flex flex-wrap gap-2'>
                          {metaChips.length > 0 ? (
                            metaChips.map((chip) => (
                              <Chip
                                key={`${product._id}-${chip}`}
                                size='sm'
                                variant='flat'
                                className='bg-sky-500/10 text-sky-700 dark:text-sky-300'>
                                {chip}
                              </Chip>
                            ))
                          ) : (
                            <Chip
                              size='sm'
                              variant='flat'
                              className='bg-black/5 text-neutral-600 dark:bg-white/8 dark:text-neutral-300'>
                              Missing taxonomy
                            </Chip>
                          )}
                        </div>
                      </div>

                      <div className='grid min-w-full grid-cols-2 gap-2 sm:min-w-80 sm:grid-cols-4'>
                        <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-3 dark:border-white/10 dark:bg-white/5 space-y-0.5'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Stock
                          </p>
                          <p className='text-lg font-semibold text-foreground'>
                            {stock ?? 'N/A'}
                          </p>
                        </div>
                        <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-3 dark:border-white/10 dark:bg-white/5 space-y-0.5'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Starts
                          </p>
                          <p className='text-lg font-semibold text-foreground'>
                            {startingPrice == null
                              ? 'N/A'
                              : `$${formatPrice(startingPrice)}`}
                          </p>
                        </div>
                        <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-3 dark:border-white/10 dark:bg-white/5 space-y-0.5'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Denoms
                          </p>
                          <p className='text-lg font-semibold text-foreground'>
                            {product.availableDenominations?.length ?? 0}
                          </p>
                        </div>
                        <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-3 dark:border-white/10 dark:bg-white/5 space-y-0.5'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Tier
                          </p>
                          <p className='text-lg font-semibold text-foreground'>
                            {product.tier}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap items-center gap-2 pt-3'>
                      {product.featured ? (
                        <Chip
                          size='sm'
                          variant='flat'
                          className='bg-violet-500/10 text-violet-700 dark:text-violet-300'>
                          Featured
                        </Chip>
                      ) : null}
                      {product.onSale ? (
                        <Chip
                          size='sm'
                          variant='flat'
                          className='bg-rose-500/10 text-rose-700 dark:text-rose-300'>
                          On Sale
                        </Chip>
                      ) : null}
                      {product.limited ? (
                        <Chip
                          size='sm'
                          variant='flat'
                          className='bg-orange-500/10 text-orange-700 dark:text-orange-300'>
                          Limited
                        </Chip>
                      ) : null}
                      <div className='ml-auto flex gap-2'>
                        <Button
                          as={Link}
                          href={`/admin/inventory/product/${product._id}`}
                          radius='none'
                          variant='flat'
                          className='rounded-sm h-8! bg-black/5 dark:bg-white/8'>
                          Open
                        </Button>
                        <Button
                          as={Link}
                          href={`/admin/inventory/product?tabId=edit&id=${product._id}`}
                          radius='none'
                          variant='flat'
                          className='rounded-sm h-8! bg-black text-white dark:bg-white dark:text-black'>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}

const CategoryProductsContentInner = ({
  categorySlug,
}: CategoryProductsContentProps) => {
  const products = useQuery(api.products.q.listProducts, {
    categorySlug,
    limit: 100,
  })
  const category = useQuery(api.categories.q.getCategoryBySlug, {
    slug: categorySlug,
  })

  const [, setTabId, , setId] = useAdminTabId()
  const [, setSlug] = useQueryState('slug', parseAsString.withDefault(''))
  const [view, setView] = useQueryState(
    'view',
    parseAsStringEnum<CategoryProductView>([
      'cards',
      'stack',
      'table',
    ]).withDefault('cards'),
  )

  const handleEdit = () => {
    if (!category) return
    setId(category._id)
    setTabId('edit')
    setSlug(null)
  }

  const availableCount =
    products?.filter((product) => product.available !== false).length ?? 0
  const featuredCount =
    products?.filter((product) => product.featured).length ?? 0

  return (
    <div className='space-y-4 pt-2'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
        <div className='flex flex-wrap items-center gap-2 px-2'>
          <Button
            size='sm'
            as={Link}
            isIconOnly
            variant='light'
            href='/admin/inventory/category'
            className='text-neutral-500 hover:text-foreground'>
            <Icon name='chevron-left' className='size-4' />
          </Button>

          <div className='min-w-20'>
            {category?.name && (
              <Typewrite
                showCursor={false}
                speed={50}
                text={category.name}
                className='text-lg font-medium capitalize'
              />
            )}
          </div>

          <Button
            as={Link}
            href={`/admin/inventory/category?slug=${categorySlug}&id=${category?._id}&tabId=edit`}
            radius='none'
            variant='solid'
            onPress={handleEdit}
            className='rounded-xs h-8 border-white bg-gray-100/80 font-clash text-zinc-600 dark:border-transparent dark:bg-gray-200/5 dark:text-indigo-100'
            startContent={<Icon name='pencil-fill' className='size-4' />}>
            <span className='text-sm'>Edit</span>
          </Button>

          <Button
            as={Link}
            prefetch
            radius='none'
            variant='flat'
            href={`/admin/inventory/product?tabId=new&category=${categorySlug}`}
            className='rounded-xs h-8 border-white bg-gray-100/80 text-zinc-600 dark:border-transparent dark:bg-foreground/10 dark:text-blue-100'
            startContent={<Icon name='plus' className='size-4' />}>
            <span className='text-sm font-clash'>Add</span>
          </Button>
        </div>

        <div className='flex flex-col gap-3 px-2 xl:items-end'>
          <div className='flex flex-wrap items-center gap-0 border border-foreground/10'>
            {CATEGORY_PRODUCT_VIEWS.map((option) => (
              <Button
                key={option.id}
                size='sm'
                isIconOnly
                radius='none'
                variant={view === option.id ? 'flat' : 'light'}
                onPress={() => setView(option.id)}
                className={cn(
                  'rounded-xs',
                  view === option.id
                    ? 'bg-neutral-900 h-8 text-white dark:bg-white/5 '
                    : 'bg-black/5 text-neutral-700 dark:bg-transparent dark:text-neutral-200',
                )}
                startContent={
                  <Icon name={option.icon} className='size-4' />
                }></Button>
            ))}
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2 text-xs'>
          <Chip
            size='sm'
            variant='flat'
            className='bg-blue-500/10 rounded-xs h-8 text-blue-700 dark:text-blue-300'>
            <AnimatedNumber value={products?.length ?? 0} /> items
          </Chip>
          <Chip
            size='sm'
            variant='flat'
            className='bg-emerald-500/10 rounded-xs h-8 text-emerald-700 dark:text-emerald-300'>
            {availableCount} available
          </Chip>
          <Chip
            size='sm'
            variant='flat'
            className='bg-violet-500/10 rounded-xs h-8 text-violet-700 dark:text-violet-300'>
            {featuredCount} featured
          </Chip>
        </div>
      </div>

      <Suspense fallback={<div>Loading products...</div>}>
        {view === 'cards' ? (
          <ProductList products={products} />
        ) : view === 'stack' ? (
          <ProductStackView categorySlug={categorySlug} products={products} />
        ) : (
          <ProductsData
            data={products}
            title={`${category?.name ?? categorySlug} Products`}
            exportFilePrefix={`${categorySlug}-products`}
          />
        )}
      </Suspense>
    </div>
  )
}

export const CategoryProductsContent = (
  props: CategoryProductsContentProps,
) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryProductsContentInner {...props} />
    </Suspense>
  )
}
