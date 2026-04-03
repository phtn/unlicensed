'use client'

import {PrimaryImageConverterModal} from '@/app/admin/(routes)/inventory/product/primary-image-converter-modal'
import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {onError} from '@/ctx/toast'
import {useSaveAdminProductFormReturn} from '@/hooks/use-save-admin-product-form-return'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  Image,
  Tooltip,
} from '@/lib/heroui'
import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback, useMemo, useState} from 'react'

interface ProductItemProps {
  product: Doc<'products'>
  imageUrl?: string
  isOptimizeDisabled: boolean
  onEditPress: VoidFunction
  onOptimizePress: VoidFunction
  optimizeLabel: string
  optimizerIconName: IconName
}

const ProductItem = ({
  product,
  imageUrl,
  isOptimizeDisabled,
  onEditPress,
  onOptimizePress,
  optimizeLabel,
  optimizerIconName,
}: ProductItemProps) => (
  <Card
    radius='none'
    isFooterBlurred
    className='w-full h-40 col-span-4 sm:col-span-6 md:col-span-8 bg-linear-to-b from-dark-gray/50 from-10% via-transparent to-transparent dark:border-dark-gray/80'>
    <CardHeader className='absolute z-10 top-0 flex-col items-start p-2 bg-background/20 backdrop-blur-xs h-fit'>
      <h4 className='font-base capitalize text-white/90 font-clash font-normal tracking-tight'>
        {product.name}
      </h4>
    </CardHeader>
    <Image
      radius='none'
      removeWrapper
      alt={product.name}
      className='z-0 w-full h-full object-cover rounded-xs'
      src={imageUrl}
    />
    <CardFooter className='p-1.5 absolute bg-black/80 bottom-0 z-10 border border-dark-gray/20 dark:border-dark-gray/80 rounded-b-xs'>
      <div className='flex grow gap-2 items-center'>
        <div className='flex flex-col'>
          <p className='text-xs text-white'>
            <span
              className={cn('text-emerald-400 font-medium tracking-tight', {
                'text-orange-300': !product.available,
              })}>
              {product.available ? 'Available' : 'Not Available'}
            </span>
          </p>
          {/*<p className='text-tiny text-white'>
            Stock:{' '}
            <span className='text-blue-400 text-sm font-medium tracking-tight'>
              {product.stockByDenomination &&
              Object.keys(product.stockByDenomination).length > 0
                ? (
                    Object.values(product.stockByDenomination) as number[]
                  ).reduce((a, b) => a + b, 0)
                : (product.stock ?? 'N/A')}
            </span>
          </p>*/}
        </div>
      </div>
      <div className='flex items-center gap-1'>
        <Tooltip
          content={
            <div className='flex items-center space-x-1'>
              {isOptimizeDisabled ? (
                <>
                  <Icon
                    name='check'
                    className='size-3.5 text-indigo-500 dark:text-yellow-500'
                  />
                  <span>Optimized</span>
                </>
              ) : (
                <>
                  <Icon
                    name='lightning'
                    className='size-3.5 text-indigo-500 dark:text-yellow-400'
                  />
                  <span>Optimize Primary Image</span>
                </>
              )}
            </div>
          }>
          <Button
            size='sm'
            isIconOnly
            radius='none'
            variant={isOptimizeDisabled ? 'light' : 'flat'}
            onPress={onOptimizePress}
            aria-label={optimizeLabel}
            title={optimizeLabel}
            className={cn(
              'rounded-sm text-white font-semibold hover:bg-dark-gray/40 dark:hover:bg-dark-table/80',
              {
                'text-yellow-300': !isOptimizeDisabled,
                'text-indigo-500 dark:indigo-400 hover:bg-transparent dark:hover:bg-transparent':
                  optimizerIconName === 'gallery-check-bold',
                'pointer-events-none':
                  isOptimizeDisabled &&
                  optimizerIconName !== 'gallery-check-bold',
              },
            )}>
            <Icon
              name={optimizerIconName}
              className={cn('size-4', {
                'rotate-6':
                  optimizerIconName === 'lightning' && !isOptimizeDisabled,
                'size-5': optimizerIconName === 'gallery-check-bold',
              })}
            />
          </Button>
        </Tooltip>
        <Button
          size='sm'
          as={Link}
          isIconOnly
          radius='none'
          variant='tertiary'
          prefetch={true}
          href={`/admin/inventory/product?tabId=edit&id=${product._id}`}
          onPress={onEditPress}
          className='rounded-sm text-white font-semibold hover:bg-dark-gray/40 dark:hover:bg-dark-table/80'>
          <Icon name='pen' className='size-4' />
        </Button>
      </div>
    </CardFooter>
  </Card>
)

interface ProductListProps {
  products: Doc<'products'>[] | undefined
  isLoading?: boolean
  canLoadMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: VoidFunction
}

export const ProductList = ({
  products,
  isLoading = false,
  canLoadMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ProductListProps) => {
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
  const optimizedLeadImageIds = useQuery(
    api.files.upload.getTaggedStorageIds,
    imageIds.length > 0
      ? {
          storageIds: imageIds as Id<'_storage'>[],
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

    const imageId =
      convertedImageIdByProductId[activeConverterProduct._id] ??
      activeConverterProduct.image

    return (
      convertedPreviewByProductId[activeConverterProduct._id] ??
      (imageId ? (resolveUrl(imageId) ?? null) : null)
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

      const previousImageId = convertedImageIdByProductId[productId]
      const previousPreview = convertedPreviewByProductId[productId]

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
          if (previousImageId) {
            next[productId] = previousImageId
          } else {
            delete next[productId]
          }
          return next
        })
        setConvertedPreviewByProductId((current) => {
          const next = {...current}
          if (previousPreview) {
            next[productId] = previousPreview
          } else {
            delete next[productId]
          }
          return next
        })
        onError(
          error instanceof Error
            ? error.message
            : 'Failed to apply optimized image to the product.',
        )
      }
    },
    [
      activeConverterProductId,
      convertedImageIdByProductId,
      convertedPreviewByProductId,
      updateProduct,
    ],
  )

  return (
    <>
      <section className='h-[91lvh] pb-28 overflow-auto px-2'>
        {isLoading && products?.length === 0 ? (
          <p className='text-sm text-neutral-500 px-4 font-okxs'>Loading...</p>
        ) : products?.length === 0 ? (
          <p className='text-sm text-neutral-500 px-4 font-okxs'>0 products</p>
        ) : (
          <div className='space-y-4'>
            <ul className='grid gap-0.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6'>
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

                return (
                  <li key={product._id}>
                    <ProductItem
                      product={product}
                      imageUrl={currentImageUrl}
                      isOptimizeDisabled={!canConvertPrimaryImage}
                      onEditPress={saveAdminProductFormReturn}
                      onOptimizePress={() => openConverter(product._id)}
                      optimizeLabel={
                        !currentImageId
                          ? 'No lead image available'
                          : isLeadImageOptimized
                            ? 'Lead image optimized'
                            : 'Optimize lead image'
                      }
                      optimizerIconName={
                        isLeadImageOptimized
                          ? 'gallery-check-bold'
                          : 'lightning'
                      }
                    />
                  </li>
                )
              })}
            </ul>
            {onLoadMore && (canLoadMore || isLoadingMore) && (
              <div className='flex justify-center pb-6'>
                <Button
                  radius='none'
                  variant='tertiary'
                  isLoading={isLoadingMore}
                  isDisabled={isLoadingMore}
                  onPress={onLoadMore}
                  className='font-brk'>
                  Load more
                </Button>
              </div>
            )}
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
        categorySlug={activeConverterProduct?.categorySlug ?? null}
        productBrands={activeConverterProduct?.brand ?? []}
        suggestedFileNameStem={activeConverterProduct?.name ?? null}
      />
    </>
  )
}
