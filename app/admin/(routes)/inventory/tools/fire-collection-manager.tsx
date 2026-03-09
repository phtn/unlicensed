'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {Button, Image, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const MAX_LIBRARY_RESULTS = 24

const getBrandLabel = (product: Doc<'products'>) => {
  if (Array.isArray(product.brand) && product.brand.length > 0) {
    return product.brand.join(', ')
  }

  return 'Unbranded'
}

const matchesSearch = (product: Doc<'products'>, query: string) => {
  if (!query) {
    return true
  }

  const haystack = [
    product.name,
    product.slug,
    product.categorySlug,
    getBrandLabel(product),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

interface ProductTileProps {
  product: Doc<'products'>
  imageUrl?: string | null
  actionLabel: string
  emptyLabel?: string
  onAction: (productId: string) => void
  disabled?: boolean
  isBusy?: boolean
}

const ProductTile = ({
  product,
  imageUrl,
  actionLabel,
  emptyLabel = 'No image',
  onAction,
  disabled = false,
  isBusy = false,
}: ProductTileProps) => (
  <article className='flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/80 p-3'>
    <div className='flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sidebar/70'>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={product.name}
          radius='none'
          removeWrapper
          className='size-full object-cover'
        />
      ) : (
        <span className='px-2 text-center text-[10px] uppercase tracking-[0.3em] text-foreground/40'>
          {emptyLabel}
        </span>
      )}
    </div>

    <div className='min-w-0 flex-1'>
      <h3 className='truncate font-okxs text-sm font-semibold text-foreground'>
        {product.name}
      </h3>
      <p className='mt-1 text-xs text-foreground/55'>
        {product.categorySlug || 'uncategorized'} · {getBrandLabel(product)}
      </p>
      <p className='mt-2 text-xs uppercase tracking-[0.25em] text-foreground/40'>
        {product.available ? 'Available' : 'Unavailable'}
      </p>
    </div>

    <Button
      radius='none'
      variant='flat'
      isLoading={isBusy}
      isDisabled={disabled}
      onPress={() => onAction(String(product._id))}
      className='min-w-24 rounded-lg bg-sidebar px-4 font-okxs text-xs uppercase tracking-[0.25em] text-foreground'
    >
      {actionLabel}
    </Button>
  </article>
)

export const FireCollectionManager = () => {
  const {user} = useAuthCtx()
  const updateFireCollection = useMutation(api.admin.m.updateFireCollectionProducts)
  const fireCollectionConfig = useQuery(api.admin.q.getFireCollectionConfig, {})
  const libraryProducts = useQuery(api.products.q.listProducts, {limit: 500})
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const [activeProductId, setActiveProductId] = useState<string | null>(null)
  const [status, setStatus] = useState<null | 'saved' | 'error'>(null)
  const clearStatusTimeoutRef = useRef<number | null>(null)

  const selectedIds = useMemo(
    () => fireCollectionConfig?.productIds ?? [],
    [fireCollectionConfig?.productIds],
  )
  const selectedProducts = useQuery(
    api.products.q.getProductsByIds,
    selectedIds.length > 0 ? {productIds: selectedIds} : 'skip',
  )

  const imageIds = useMemo(
    () =>
      [...(selectedProducts ?? []), ...(libraryProducts ?? [])]
        .flatMap((product) => {
          if (!product.image) {
            return []
          }

          const imageId = String(product.image)
          return imageId.startsWith('http') ? [] : [imageId]
        }),
    [libraryProducts, selectedProducts],
  )
  const resolveUrl = useStorageUrls(imageIds)

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const availableProducts = useMemo(() => {
    if (!libraryProducts) {
      return []
    }

    return libraryProducts
      .filter((product) => !selectedIdSet.has(String(product._id)))
      .filter((product) => matchesSearch(product, deferredQuery))
      .slice(0, MAX_LIBRARY_RESULTS)
  }, [deferredQuery, libraryProducts, selectedIdSet])

  useEffect(() => {
    return () => {
      if (clearStatusTimeoutRef.current) {
        window.clearTimeout(clearStatusTimeoutRef.current)
      }
    }
  }, [])

  const persistProductIds = async (nextProductIds: string[], productId: string) => {
    setActiveProductId(productId)
    setStatus(null)

    try {
      await updateFireCollection({
        productIds: nextProductIds,
        uid: user?.uid ?? 'anonymous',
      })

      setStatus('saved')
      if (clearStatusTimeoutRef.current) {
        window.clearTimeout(clearStatusTimeoutRef.current)
      }
      clearStatusTimeoutRef.current = window.setTimeout(() => {
        setStatus(null)
      }, 2200)
    } catch (error) {
      console.error('Failed to update fire collection', error)
      setStatus('error')
    } finally {
      setActiveProductId(null)
    }
  }

  return (
    <section className='flex w-full flex-col gap-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-foreground/10 bg-background/70 p-5'>
        <div className='flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h2 className='text-xl font-clash font-semibold text-foreground'>
              Fire Collection Manager
            </h2>
            <p className='mt-1 max-w-2xl text-sm text-foreground/65'>
              Control the one-row storefront carousel. Products keep the order
              they were added in, autoplay on the storefront, and can still be
              swiped manually.
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-foreground/45'>
            <span>{selectedIds.length} selected</span>
            {status === 'saved' && <span className='text-emerald-500'>Saved</span>}
            {status === 'error' && (
              <span className='text-destructive'>Save failed</span>
            )}
          </div>
        </div>

        <Input
          value={query}
          onValueChange={setQuery}
          placeholder='Search products by name, brand, category, or slug'
          classNames={commonInputClassNames}
        />
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'>
        <section className='rounded-3xl border border-foreground/10 bg-background/70 p-5'>
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-sm font-okxs uppercase tracking-[0.3em] text-foreground/50'>
              Current Row
            </h3>
            <span className='text-xs text-foreground/45'>
              Front of the array renders first
            </span>
          </div>

          <div className='mt-4 flex flex-col gap-3'>
            {selectedIds.length === 0 && (
              <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                No products selected yet.
              </div>
            )}

            {selectedIds.length > 0 && selectedProducts === undefined && (
              <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                Loading current collection...
              </div>
            )}

            {(selectedProducts ?? []).map((product) => (
              <ProductTile
                key={product._id}
                product={product}
                imageUrl={resolveProductImage(product.image, resolveUrl)}
                actionLabel='Remove'
                disabled={activeProductId !== null}
                isBusy={activeProductId === String(product._id)}
                onAction={(productId) =>
                  persistProductIds(
                    selectedIds.filter((selectedId) => selectedId !== productId),
                    productId,
                  )
                }
              />
            ))}
          </div>
        </section>

        <section className='rounded-3xl border border-foreground/10 bg-background/70 p-5'>
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-sm font-okxs uppercase tracking-[0.3em] text-foreground/50'>
              Product Library
            </h3>
            <span className='text-xs text-foreground/45'>
              Showing up to {MAX_LIBRARY_RESULTS} matches
            </span>
          </div>

          <div className='mt-4 flex flex-col gap-3'>
            {libraryProducts === undefined && (
              <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                Loading products...
              </div>
            )}

            {libraryProducts !== undefined && availableProducts.length === 0 && (
              <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                No products match the current search.
              </div>
            )}

            {availableProducts.map((product) => (
              <ProductTile
                key={product._id}
                product={product}
                imageUrl={resolveProductImage(product.image, resolveUrl)}
                actionLabel='Add'
                disabled={activeProductId !== null}
                isBusy={activeProductId === String(product._id)}
                onAction={(productId) =>
                  persistProductIds([...selectedIds, productId], productId)
                }
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
