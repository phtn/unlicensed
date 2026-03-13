'use client'

import {
  commonInputClassNames,
  narrowInputClassNames,
} from '@/app/admin/_components/ui/fields'
import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {Button, Image, Input, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react'

const MAX_LIBRARY_RESULTS = 24
const RANDOM_INSERT_COUNT = 15

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

const pickRandomProductIds = (productIds: string[], count: number) => {
  if (productIds.length <= count) {
    return productIds
  }

  const shuffled = [...productIds]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }

  return shuffled.slice(0, count)
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
      <h3 className='truncate font-clash text-sm font-medium text-foreground'>
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
      className='min-w-24 rounded-lg bg-sidebar px-4 font-okxs text-xs uppercase tracking-[0.25em] text-foreground'>
      {actionLabel}
    </Button>
  </article>
)

export const FireCollectionManager = () => {
  const {user} = useAuthCtx()
  const createFireCollection = useMutation(api.admin.m.createFireCollection)
  const updateFireCollection = useMutation(api.admin.m.updateFireCollection)
  const deleteFireCollection = useMutation(api.admin.m.deleteFireCollection)
  const fireCollections = useQuery(api.admin.q.getFireCollectionsConfig, {})
  const libraryProducts = useQuery(api.products.q.listProducts, {limit: 500})
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null)
  const [createTitle, setCreateTitle] = useState('')
  const [collectionTitle, setCollectionTitle] = useState('')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [status, setStatus] = useState<null | 'saved' | 'error'>(null)
  const clearStatusTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (clearStatusTimeoutRef.current) {
        window.clearTimeout(clearStatusTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!fireCollections || fireCollections.length === 0) {
      setSelectedCollectionId(null)
      return
    }

    if (
      selectedCollectionId === null ||
      !fireCollections.some(
        (collection) => collection.id === selectedCollectionId,
      )
    ) {
      setSelectedCollectionId(fireCollections[0].id)
    }
  }, [fireCollections, selectedCollectionId])

  const selectedCollection = useMemo(
    () =>
      fireCollections?.find(
        (collection) => collection.id === selectedCollectionId,
      ) ?? null,
    [fireCollections, selectedCollectionId],
  )

  useEffect(() => {
    setCollectionTitle(selectedCollection?.title ?? '')
  }, [selectedCollection?.id, selectedCollection?.title])

  const selectedIds = useMemo(
    () => selectedCollection?.productIds ?? [],
    [selectedCollection?.productIds],
  )

  const selectedProducts = useQuery(
    api.products.q.getProductsByIds,
    selectedIds.length > 0 ? {productIds: selectedIds} : 'skip',
  )

  const imageIds = useMemo(
    () =>
      [...(selectedProducts ?? []), ...(libraryProducts ?? [])].flatMap(
        (product) => {
          if (!product.image) {
            return []
          }

          const imageId = String(product.image)
          return imageId.startsWith('http') ? [] : [imageId]
        },
      ),
    [libraryProducts, selectedProducts],
  )
  const resolveUrl = useStorageUrls(imageIds)

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const unselectedLibraryProductIds = useMemo(() => {
    if (!libraryProducts) {
      return []
    }

    return libraryProducts
      .filter((product) => !selectedIdSet.has(String(product._id)))
      .map((product) => String(product._id))
  }, [libraryProducts, selectedIdSet])
  const availableProducts = useMemo(() => {
    if (!libraryProducts) {
      return []
    }

    return libraryProducts
      .filter((product) => !selectedIdSet.has(String(product._id)))
      .filter((product) => matchesSearch(product, deferredQuery))
      .slice(0, MAX_LIBRARY_RESULTS)
  }, [deferredQuery, libraryProducts, selectedIdSet])

  const enabledCollectionsCount = useMemo(
    () =>
      fireCollections?.filter((collection) => collection.enabled).length ?? 0,
    [fireCollections],
  )

  const showSavedStatus = () => {
    setStatus('saved')
    if (clearStatusTimeoutRef.current) {
      window.clearTimeout(clearStatusTimeoutRef.current)
    }
    clearStatusTimeoutRef.current = window.setTimeout(() => {
      setStatus(null)
    }, 2200)
  }

  const runMutation = async (
    key: string,
    action: () => Promise<unknown>,
    options?: {
      onSuccess?: () => void
    },
  ) => {
    setActiveKey(key)
    setStatus(null)

    try {
      await action()
      options?.onSuccess?.()
      showSavedStatus()
    } catch (error) {
      console.error('Failed to update collections', error)
      setStatus('error')
    } finally {
      setActiveKey(null)
    }
  }

  const handleCreateCollection = async () => {
    await runMutation('create-collection', async () => {
      const result = await createFireCollection({
        title: createTitle,
        uid: user?.uid ?? 'anonymous',
      })
      setCreateTitle('')
      setSelectedCollectionId(result.collectionId)
    })
  }

  const persistCollectionProducts = async (
    nextProductIds: string[],
    productId: string,
  ) => {
    if (!selectedCollection) return

    await runMutation(`product:${productId}`, () =>
      updateFireCollection({
        collectionId: selectedCollection.id,
        patch: {productIds: nextProductIds},
        uid: user?.uid ?? 'anonymous',
      }),
    )
  }

  const handleSaveCollectionTitle = async () => {
    if (!selectedCollection) return

    const trimmedTitle = collectionTitle.trim()
    if (!trimmedTitle || trimmedTitle === selectedCollection.title) return

    await runMutation(`title:${selectedCollection.id}`, () =>
      updateFireCollection({
        collectionId: selectedCollection.id,
        patch: {title: trimmedTitle},
        uid: user?.uid ?? 'anonymous',
      }),
    )
  }

  const handleToggleCollection = async (enabled: boolean) => {
    if (!selectedCollection) return

    await runMutation(`toggle:${selectedCollection.id}`, () =>
      updateFireCollection({
        collectionId: selectedCollection.id,
        patch: {enabled},
        uid: user?.uid ?? 'anonymous',
      }),
    )
  }

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return

    const nextSelection =
      fireCollections?.find(
        (collection) => collection.id !== selectedCollection.id,
      )?.id ?? null

    await runMutation(`delete:${selectedCollection.id}`, () =>
      deleteFireCollection({
        collectionId: selectedCollection.id,
        uid: user?.uid ?? 'anonymous',
      }),
    )
    setSelectedCollectionId(nextSelection)
  }

  const handleInsertRandomProducts = async () => {
    if (!selectedCollection || !libraryProducts) return
    if (unselectedLibraryProductIds.length === 0) {
      return
    }

    const randomProductIds = pickRandomProductIds(
      unselectedLibraryProductIds,
      RANDOM_INSERT_COUNT,
    )

    await runMutation(`random:${selectedCollection.id}`, () =>
      updateFireCollection({
        collectionId: selectedCollection.id,
        patch: {
          productIds: [...selectedIds, ...randomProductIds],
        },
        uid: user?.uid ?? 'anonymous',
      }),
    )
  }

  return (
    <section className='flex w-full flex-col gap-6'>
      <div className='flex flex-col gap-3 rounded-3xl border border-foreground/10 bg-background/70 p-5'>
        <div className='flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between'>
          <div className='flex items-center justify-between w-full'>
            <div>
              <div className='flex items-center space-x-4'>
                <h2 className='text-xl font-clash font-semibold text-foreground'>
                  Collection Creator
                </h2>

                <div className='flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-foreground/45'>
                  <span>{fireCollections?.length ?? 0} collections</span>
                  <span>{enabledCollectionsCount} enabled</span>
                </div>
                <div className='flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-foreground/45'>
                  {status === 'saved' && (
                    <span className='text-emerald-500'>Saved</span>
                  )}
                  {status === 'error' && (
                    <span className='text-destructive'>Save failed</span>
                  )}
                </div>
              </div>

              <p className='mt-1 overflow-scroll text-sm text-foreground/65'>
                Build multiple product collections, decide which ones are live,
                and curate the order of products inside each row.
              </p>
            </div>
            <Button
              radius='none'
              onPress={handleCreateCollection}
              isLoading={activeKey === 'create-collection'}
              className='rounded-lg bg-foreground px-5 font-okxs text-xs uppercase tracking-[0.25em] text-background'
              isDisabled={activeKey !== null}>
              Create Collection
            </Button>
          </div>
        </div>

        <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]'>
          {/*<Input
            value={createTitle}
            onValueChange={setCreateTitle}
            placeholder='Create a new collection title'
            classNames={commonInputClassNames}
          />*/}
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[18rem_minmax(0,0.95fr)_minmax(0,1fr)]'>
        <section className='flex min-h-0 flex-col rounded-xl border border-foreground/10 bg-background/70 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-xs font-okxs uppercase tracking-[0.3em] text-foreground/50'>
              Collections
            </h3>
            <span className='text-xs text-foreground/45'>Select one</span>
          </div>

          <ScrollArea className='mt-4 max-h-[36.01rem] pr-3'>
            <div className='flex flex-col gap-3'>
              {!fireCollections?.length && (
                <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                  No collections yet. Create one to get started.
                </div>
              )}

              {(fireCollections ?? []).map((collection) => {
                const isSelected = collection.id === selectedCollectionId
                return (
                  <button
                    key={collection.id}
                    type='button'
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-foreground/30 bg-sidebar'
                        : 'border-foreground/10 bg-background/80 hover:border-foreground/20'
                    }`}>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h3 className='truncate font-okxs text-sm font-semibold text-foreground'>
                          {collection.title}
                        </h3>
                        <p className='mt-1 text-xs uppercase tracking-[0.22em] text-foreground/45'>
                          {collection.productIds.length} products
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.25em] ${
                          collection.enabled
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-foreground/8 text-foreground/45'
                        }`}>
                        {collection.enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </section>

        <div className='space-y-6'>
          <section className='flex flex-col rounded-xl border border-foreground/10 bg-background/70 p-4'>
            <div className='flex items-center justify-between gap-3'>
              <h3 className='text-xs font-okxs uppercase tracking-[0.3em] text-foreground/50'>
                Settings
              </h3>
              {selectedCollection && (
                <div className='flex items-center space-x-2'>
                  <div className='flex items-center space-x-2 bg-background/80 p-1'>
                    <div>
                      <p className='text-sm font-medium text-foreground'>
                        Enabled
                      </p>
                    </div>
                    <Switch
                      isSelected={selectedCollection.enabled}
                      isDisabled={activeKey !== null}
                      onValueChange={handleToggleCollection}
                      size='sm'
                    />
                  </div>

                  <Button
                    size='sm'
                    radius='none'
                    variant='flat'
                    color='danger'
                    isDisabled={activeKey !== null}
                    onPress={handleDeleteCollection}
                    className='rounded-md px-3 font-okxs text-xs uppercase tracking-[0.25em]'>
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {!selectedCollection ? (
              <div className='mt-4 rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                Pick a collection to edit its title, visibility, and products.
              </div>
            ) : (
              <div className='mt-4 flex flex-col gap-4'>
                <div className='flex items-center gap-4'>
                  <Input
                    value={collectionTitle}
                    onValueChange={setCollectionTitle}
                    placeholder='Collection title'
                    classNames={narrowInputClassNames}
                  />
                  <Button
                    size='sm'
                    radius='none'
                    variant='flat'
                    isDisabled={
                      activeKey !== null ||
                      collectionTitle.trim().length === 0 ||
                      collectionTitle.trim() === selectedCollection.title
                    }
                    onPress={handleSaveCollectionTitle}
                    className='rounded-md px-6 font-okxs text-xs uppercase tracking-[0.25em] bg-dark-table text-white'>
                    Save Title
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className='flex flex-col rounded-xl border border-foreground/10 bg-background/70 p-4 h-fit'>
            <div className='flex items-center justify-between gap-3'>
              <h3 className='text-xs font-okxs uppercase tracking-[0.3em] text-foreground/50'>
                Current Collection
              </h3>
              <span className='text-xs text-foreground/45'>
                Front of the list renders first
              </span>
            </div>

            <ScrollArea className='mt-4 xl:flex-1'>
              <div className='flex flex-col gap-3'>
                {!selectedCollection && (
                  <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                    Choose a collection to manage its products.
                  </div>
                )}

                {selectedCollection && selectedIds.length === 0 && (
                  <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                    No products selected yet.
                  </div>
                )}

                {selectedCollection &&
                  selectedIds.length > 0 &&
                  selectedProducts === undefined && (
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
                    disabled={activeKey !== null || !selectedCollection}
                    isBusy={activeKey === `product:${String(product._id)}`}
                    onAction={(productId) =>
                      persistCollectionProducts(
                        selectedIds.filter(
                          (selectedId) => selectedId !== productId,
                        ),
                        productId,
                      )
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          </section>
        </div>

        <section className='flex min-h-0 flex-col rounded-xl border border-foreground/10 bg-background/70 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h3 className='text-xs font-okxs uppercase tracking-[0.3em] text-foreground/50'>
                Product Library
              </h3>
              <span className='text-xs text-foreground/45'>
                Showing up to {MAX_LIBRARY_RESULTS} matches
              </span>
            </div>

            <Button
              size='sm'
              radius='none'
              variant='flat'
              isDisabled={
                activeKey !== null ||
                !selectedCollection ||
                libraryProducts === undefined ||
                unselectedLibraryProductIds.length === 0
              }
              isLoading={
                selectedCollection !== null &&
                activeKey === `random:${selectedCollection.id}`
              }
              onPress={handleInsertRandomProducts}
              className='rounded-md px-4 font-okxs text-[11px] uppercase tracking-[0.25em] bg-sidebar text-foreground'>
              Add {RANDOM_INSERT_COUNT} Random
            </Button>
          </div>

          <Input
            value={query}
            onValueChange={setQuery}
            placeholder='Search products by name, brand, category, or slug'
            classNames={commonInputClassNames}
            className='mt-4'
          />

          <ScrollArea className='mt-4 xl:flex-1'>
            <div className='flex flex-col gap-3'>
              {!selectedCollection && (
                <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                  Create or select a collection before adding products.
                </div>
              )}

              {selectedCollection && libraryProducts === undefined && (
                <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                  Loading products...
                </div>
              )}

              {selectedCollection &&
                libraryProducts !== undefined &&
                availableProducts.length === 0 && (
                  <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                    No products match the current search.
                  </div>
                )}

              {selectedCollection &&
                availableProducts.map((product) => (
                  <ProductTile
                    key={product._id}
                    product={product}
                    imageUrl={resolveProductImage(product.image, resolveUrl)}
                    actionLabel='Add'
                    disabled={activeKey !== null}
                    isBusy={activeKey === `product:${String(product._id)}`}
                    onAction={(productId) =>
                      persistCollectionProducts(
                        [...selectedIds, productId],
                        productId,
                      )
                    }
                  />
                ))}
            </div>
          </ScrollArea>
        </section>
      </div>
    </section>
  )
}
