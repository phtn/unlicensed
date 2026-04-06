'use client'

import {PrimaryImageConverterModal} from '@/app/admin/(routes)/inventory/product/primary-image-converter-modal'
import {ProductList} from '@/app/admin/(routes)/inventory/product/product-list'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Typewrite} from '@/components/expermtl/typewrite'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {onError} from '@/ctx/toast'
import {useConvexSnapshotQuery} from '@/hooks/use-convex-snapshot-query'
import {useMobile} from '@/hooks/use-mobile'
import {useSaveAdminProductFormReturn} from '@/hooks/use-save-admin-product-form-return'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon, IconName} from '@/lib/icons'
import {formatStockDisplay} from '@/lib/productStock'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, Chip} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {parseAsString, parseAsStringEnum, useQueryState} from 'nuqs'
import {Suspense, useCallback, useMemo, useState} from 'react'
import {ProductsData} from '../../product/products-data'

import {LegacyImage as Image} from '@/components/ui/legacy-image'

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
  const router = useRouter()
  const saveAdminProductFormReturn = useSaveAdminProductFormReturn()
  const updateProduct = useMutation(api.products.m.updateProduct)
  const [activeConverterProductId, setActiveConverterProductId] = useState<
    string | null
  >(null)
  const [isConverterOpen, setIsConverterOpen] = useState(false)
  const [convertedPreviewByProductId, setConvertedPreviewByProductId] =
    useState<Record<string, string>>({})
  const [convertedImageIdByProductId, setConvertedImageIdByProductId] =
    useState<Record<string, string>>({})
  const leadImageStorageIds = useMemo(
    () => [
      ...new Set(
        (products ?? []).flatMap((product) => {
          const imageId =
            convertedImageIdByProductId[product._id] ?? product.image
          return imageId ? [imageId] : []
        }),
      ),
    ],
    [convertedImageIdByProductId, products],
  )
  const optimizedLeadImageIds = useQuery(
    api.files.upload.getTaggedStorageIds,
    leadImageStorageIds.length > 0
      ? {
          storageIds: leadImageStorageIds as Id<'_storage'>[],
          requiredTag: 'gallery:optimized',
        }
      : 'skip',
  )
  const optimizedStorageIds = useMemo(
    () =>
      new Set(
        (optimizedLeadImageIds ?? []).map((storageId) => String(storageId)),
      ),
    [optimizedLeadImageIds],
  )
  const imageIds = useMemo(
    () => [
      ...new Set(
        (products ?? []).flatMap((product) => {
          const imageId =
            convertedImageIdByProductId[product._id] ?? product.image
          return imageId ? [imageId] : []
        }),
      ),
    ],
    [convertedImageIdByProductId, products],
  )
  const resolveUrl = useStorageUrls(imageIds as string[])
  const activeConverterProduct = useMemo(
    () =>
      (products ?? []).find(
        (product) => product._id === activeConverterProductId,
      ) ?? null,
    [activeConverterProductId, products],
  )
  const activeConverterSourceUrl = useMemo(() => {
    if (!activeConverterProduct) {
      return null
    }

    return (
      convertedPreviewByProductId[activeConverterProduct._id] ??
      (activeConverterProduct.image
        ? (resolveUrl(
            convertedImageIdByProductId[activeConverterProduct._id] ??
              activeConverterProduct.image,
          ) ?? null)
        : null)
    )
  }, [
    activeConverterProduct,
    convertedImageIdByProductId,
    convertedPreviewByProductId,
    resolveUrl,
  ])
  const openConverter = useCallback((productId: string) => {
    setActiveConverterProductId(productId)
    setIsConverterOpen(true)
  }, [])
  const handleConvertedPrimary = useCallback(
    async ({storageId, url}: {storageId: string; url: string | null}) => {
      const productId = activeConverterProductId
      if (!productId) {
        return
      }

      setConvertedImageIdByProductId((current) => ({
        ...current,
        [productId]: storageId,
      }))

      if (url) {
        setConvertedPreviewByProductId((current) => ({
          ...current,
          [productId]: url,
        }))
      }

      try {
        await updateProduct({
          id: productId as Id<'products'>,
          fields: {
            image: storageId as Id<'_storage'>,
          },
        })
      } catch (error) {
        setConvertedImageIdByProductId((current) => {
          const next = {...current}
          delete next[productId]
          return next
        })
        setConvertedPreviewByProductId((current) => {
          const next = {...current}
          delete next[productId]
          return next
        })
        onError(
          error instanceof Error
            ? error.message
            : 'Failed to apply optimized image to the product.',
        )
      }
    },
    [activeConverterProductId, updateProduct],
  )

  return (
    <>
      <section className='h-[91lvh] overflow-auto px-2 pb-28'>
        {products?.length === 0 ? (
          <p className='px-4 text-sm text-neutral-500'>
            No products in this category.
          </p>
        ) : (
          <div className='space-y-3'>
            {products?.map((product) => {
              const currentImageId =
                convertedImageIdByProductId[product._id] ?? product.image
              const currentImageUrl =
                convertedPreviewByProductId[product._id] ??
                (currentImageId
                  ? (resolveUrl(currentImageId) ?? undefined)
                  : undefined)
              const isLeadImageOptimized = currentImageId
                ? optimizedStorageIds.has(String(currentImageId))
                : false
              const canConvertPrimaryImage = Boolean(
                currentImageId && currentImageUrl && !isLeadImageOptimized,
              )
              const stock = formatStockDisplay(product)
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
                  className='overflow-hidden border border-black/5 bg-white/80 dark:border-white/10 dark:bg-dark-table/45 rounded-xs p-0'>
                  <div className='flex flex-col md:flex-row'>
                    <div
                      className={cn(
                        'relative h-40 shrink-0 overflow-hidden bg-linear-to-br from-slate-200/60 to-transparent md:h-auto dark:from-white/6 flex space-x-4 md:space-x-0',
                        {'md:max-w-40': currentImageUrl},
                      )}>
                      {currentImageUrl ? (
                        <Image
                          removeWrapper
                          alt={product.name ?? 'Product image'}
                          src={currentImageUrl}
                          loading='eager'
                          className='h-40 w-40 aspect-square'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.08),transparent)] text-3xl font-semibold uppercase text-slate-600 dark:text-slate-300'>
                          {(product.name ?? '?').slice(0, 1)}
                        </div>
                      )}
                      <div
                        className={cn('md:hidden gap-2', {
                          'grid grid-cols-2 w-full': !!currentImageUrl,
                        })}>
                        <div className='bg-neutral-50/80 p-2 dark:bg-white/5 space-y-1 h-fit'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Stock
                          </p>
                          <p className='text-base font-medium text-foreground'>
                            {stock || 'N/A'}
                          </p>
                        </div>
                        <div className='rounded-sm bg-neutral-50/80 p-2 dark:bg-white/5 space-y-1 h-fit'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Starts
                          </p>
                          <p className='text-base font-medium text-foreground'>
                            {startingPrice == null
                              ? 'N/A'
                              : `$${formatPrice(startingPrice)}`}
                          </p>
                        </div>
                        <div className='rounded-sm bg-neutral-50/80 p-2 dark:bg-white/5 space-y-1 h-fit'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Denoms
                          </p>
                          <p className='text-base font-medium text-foreground'>
                            {product.availableDenominations?.length ?? 0}
                          </p>
                        </div>
                        <div className='rounded-sm bg-neutral-50/80 p-2 dark:bg-white/5 space-y-1 h-fit'>
                          <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                            Tier
                          </p>
                          <p className='text-base font-medium text-foreground uppercase'>
                            {product.tier}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-1 flex-col gap-4 p-4'>
                      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
                        <div className='space-y-3'>
                          <div>
                            <div className='flex flex-wrap items-center gap-2'>
                              <h3 className='text-lg font-clash tracking-tight text-foreground'>
                                {product.name}
                              </h3>
                              <Chip
                                size='sm'
                                variant='tertiary'
                                className={cn(
                                  'font-medium bg-amber-500/10 uppercase text-amber-700 dark:text-amber-300 h-6!',
                                  {
                                    'bg-emerald-500 uppercase dark:bg-emerald-500/10 text-white dark:text-emerald-300 rounded-sm':
                                      product.available,
                                  },
                                )}>
                                {product.available === false
                                  ? 'Unavailable'
                                  : 'Available'}
                              </Chip>
                            </div>
                            <p className='text-xs text-foreground/50'>
                              {product.slug ?? `${categorySlug}-${product._id}`}
                            </p>
                          </div>

                          <p className='max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300'>
                            {product.shortDescription?.trim() ||
                              product.description?.trim() ||
                              'No description.'}
                          </p>

                          <div>
                            <div className='flex flex-wrap gap-2'>
                              {metaChips.length > 0 ? (
                                metaChips.map((chip) => (
                                  <Chip
                                    key={`${product._id}-${chip}`}
                                    size='sm'
                                    variant='tertiary'
                                    className='bg-sky-500/10 text-sky-700 dark:text-sky-300 uppercase h-6 md:h-6 rounded-sm'>
                                    {chip}
                                  </Chip>
                                ))
                              ) : (
                                <Chip
                                  size='sm'
                                  variant='tertiary'
                                  className='bg-black/5 text-neutral-600 dark:bg-white/8 dark:text-neutral-300'>
                                  Missing taxonomy
                                </Chip>
                              )}
                            </div>
                            <div className='flex min-h-0 flex-wrap items-center gap-2 min-w-0'>
                              {product.featured ? (
                                <Chip
                                  size='sm'
                                  variant='tertiary'
                                  className='bg-violet-500/10 text-violet-700 dark:text-violet-300'>
                                  Featured
                                </Chip>
                              ) : null}
                              {product.onSale ? (
                                <Chip
                                  size='sm'
                                  variant='tertiary'
                                  className='bg-rose-500/10 text-rose-700 dark:text-rose-300'>
                                  On Sale
                                </Chip>
                              ) : null}
                              {product.limited ? (
                                <Chip
                                  size='sm'
                                  variant='tertiary'
                                  className='bg-orange-500/10 text-orange-700 dark:text-orange-300'>
                                  Limited
                                </Chip>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className='h-fit'>
                          <div className='hidden md:grid md:w-full md:min-w-full grid-cols-2 gap-2 sm:min-w-80 sm:grid-cols-4'>
                            <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-2 dark:border-white/10 dark:bg-white/5 space-y-1 h-fit'>
                              <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                                Stock
                              </p>
                              <p className='text-base font-medium text-foreground'>
                                {stock || 'N/A'}
                              </p>
                            </div>
                            <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-2 dark:border-white/10 dark:bg-white/5 space-y-1 h-fit'>
                              <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                                Starts
                              </p>
                              <p className='text-base font-medium text-foreground'>
                                {startingPrice == null
                                  ? 'N/A'
                                  : `$${formatPrice(startingPrice)}`}
                              </p>
                            </div>
                            <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-2 dark:border-white/10 dark:bg-white/5 space-y-1 h-fit'>
                              <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                                Denoms
                              </p>
                              <p className='text-base font-medium text-foreground'>
                                {product.availableDenominations?.length ?? 0}
                              </p>
                            </div>
                            <div className='rounded-sm border border-black/5 bg-neutral-50/80 p-2 dark:border-white/10 dark:bg-white/5 space-y-1 h-fit'>
                              <p className='text-xs font-ios uppercase tracking-[0.18em] text-neutral-500'>
                                Tier
                              </p>
                              <p className='text-base font-medium text-foreground uppercase'>
                                {product.tier}
                              </p>
                            </div>
                          </div>

                          <div className='flex flex-col gap-2 pt-3 md:pt-0 md:flex-row items-end justify-end h-16 w-full'>
                            <div className='flex shrink-0 gap-2 md:pl-4'>
                              <Button
                                variant={
                                  canConvertPrimaryImage ? 'primary' : 'ghost'
                                }
                                isDisabled={!canConvertPrimaryImage}
                                isIconOnly={!canConvertPrimaryImage}
                                className={cn(
                                  'rounded-sm h-8! bg-indigo-950 text-white dark:text-white',
                                  {
                                    'bg-transparent text-black dark:text-white pointer-events-none':
                                      !canConvertPrimaryImage,
                                  },
                                )}
                                onPress={() => openConverter(product._id)}>
                                {!currentImageId
                                  ? 'No Image'
                                  : isLeadImageOptimized
                                    ? ''
                                    : 'Optimize Image'}
                                <Icon
                                  name={
                                    canConvertPrimaryImage
                                      ? 'lightning'
                                      : 'gallery-check-bold'
                                  }
                                  className={cn(
                                    'size-4 rotate-6 text-yellow-500 m-auto',
                                    {
                                      'rotate-0 size-6 text-indigo-500 pointer-events-none':
                                        !canConvertPrimaryImage,
                                    },
                                  )}
                                />
                              </Button>
                              <Button
                                variant='tertiary'
                                className='rounded-sm h-8! bg-black/5 dark:bg-white/8'
                                onPress={() => {
                                  saveAdminProductFormReturn()
                                  void router.push(
                                    `/admin/inventory/product/${product._id}`,
                                  )
                                }}>
                                Open
                              </Button>
                              <Button
                                variant='tertiary'
                                className='rounded-sm h-8! bg-black text-white dark:bg-white dark:text-black'
                                onPress={() => {
                                  saveAdminProductFormReturn()
                                  void router.push(
                                    `/admin/inventory/product?tabId=edit&id=${product._id}`,
                                  )
                                }}>
                                Edit
                              </Button>
                            </div>
                          </div>
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

      <PrimaryImageConverterModal
        isOpen={isConverterOpen}
        onOpenChangeAction={setIsConverterOpen}
        onConvertedAction={(result) => {
          void handleConvertedPrimary(result)
        }}
        sourceUrl={activeConverterSourceUrl}
        categorySlug={categorySlug}
        productBrands={activeConverterProduct?.brand ?? []}
        suggestedFileNameStem={activeConverterProduct?.name ?? null}
      />
    </>
  )
}

const CategoryProductsContentInner = ({
  categorySlug,
}: CategoryProductsContentProps) => {
  const router = useRouter()
  const {data: products} = useConvexSnapshotQuery(api.products.q.listProducts, {
    categorySlug,
    limit: 1000,
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

  const isMobile = useMobile()

  return (
    <div className='space-y-2 pt-2'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
        <div className='flex flex-wrap items-center gap-2 px-2'>
          <Button
            size='sm'
            isIconOnly
            variant='outline'
            className='hover:text-foreground h-7 border-transparent rounded-sm'
            onPress={() => {
              void router.push('/admin/inventory/category')
            }}>
            <Icon name='chevron-left' className='size-4 m-auto' />
          </Button>

          <div className='min-w-20'>
            {category?.name && (
              <Typewrite
                showCursor={false}
                speed={50}
                text={category.name}
                className='text-base md:text-lg font-clash font-medium capitalize'
              />
            )}
          </div>

          <Button
            isIconOnly={isMobile}
            variant='outline'
            onPress={handleEdit}
            className='rounded-sm h-6 md:h-8 w-6 md:w-fit font-clash'>
            <Icon name='pen' className='size-3 m-auto' />
            <span className='text-sm font-clash hidden md:flex'>Edit</span>
          </Button>

          <Button
            isIconOnly={isMobile}
            variant='outline'
            className='rounded-sm h-6 md:h-7 w-6 md:w-fit'
            onPress={() => {
              void router.push(
                `/admin/inventory/product?tabId=new&category=${categorySlug}`,
              )
            }}>
            <Icon name='plus' className='size-4 m-auto' />
            <span className='text-sm font-clash hidden md:flex'>Add</span>
          </Button>
          <div className='flex flex-col flex-1 gap-3 md:px-2 items-end'>
            <div className='flex flex-wrap items-center gap-0 border rounded-xs'>
              {CATEGORY_PRODUCT_VIEWS.map((option) => (
                <Button
                  key={option.id}
                  size='sm'
                  isIconOnly
                  variant={view === option.id ? 'primary' : 'ghost'}
                  onPress={() => {
                    void setView(option.id)
                  }}
                  className={cn(
                    'rounded-xs h-6 md:h-7',
                    view === option.id
                      ? 'bg-neutral-900 text-white dark:bg-white/5 '
                      : 'bg-black/5 text-neutral-700 dark:bg-transparent dark:text-neutral-200',
                  )}>
                  <Icon name={option.icon} className='size-4 m-auto' />
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 text-xs px-2 md:px-0'>
          <Chip
            size='sm'
            variant='tertiary'
            className='bg-blue-500/10 rounded-sm h-6 md:h-7 text-blue-700 dark:text-blue-300 px-2'>
            <AnimatedNumber value={products?.length ?? 0} /> items
          </Chip>
          <Chip
            size='sm'
            variant='tertiary'
            className='bg-emerald-500/10 rounded-sm h-6 md:h-8 text-emerald-700 dark:text-emerald-300 px-2'>
            {availableCount} available
          </Chip>
          <Chip
            size='sm'
            variant='tertiary'
            className='bg-violet-500/10 rounded-sm h-6 md:h-8 text-violet-700 dark:text-violet-300 px-2'>
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
