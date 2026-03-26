'use client'

import {
  narrowInputClassNames,
  narrowSelectClassNames,
} from '@/app/admin/_components/ui/fields'
import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {cn} from '@/lib/utils'
import {Button, Image, Input, Select, SelectItem, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {parseAsString, useQueryStates} from 'nuqs'
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react'

const MAX_LIBRARY_RESULTS = 24
const RANDOM_INSERT_COUNT = 15
const RANDOM_CATEGORY_ALL = '__all__'
const fireCollectionStateParsers = {
  fireCollectionId: parseAsString,
  fireCreateTitle: parseAsString.withDefault(''),
  fireCollectionTitle: parseAsString.withDefault(''),
  fireQuery: parseAsString.withDefault(''),
  fireRandomCategory: parseAsString.withDefault(RANDOM_CATEGORY_ALL),
}

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

const formatCategoryLabel = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

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
  emptyLabel = 'No image',
  onAction,
  disabled = false,
  isBusy = false,
}: ProductTileProps) => (
  <article className='flex items-end gap-3 border border-foreground/0 bg-background/80 hover:bg-sidebar/50 transition-colors duration-200 ease-out'>
    <div className='flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xs bg-sidebar/70'>
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
      <h3 className='font-clash text-sm font-semibold tracking-wider text-foreground'>
        {product.name}
      </h3>
      <p className='mt-2 text-[9px] text-foreground/60 font-okxs font-light tracking-wider'>
        {product.categorySlug || 'uncategorized'} · {getBrandLabel(product)}
      </p>
    </div>

    <Button
      radius='none'
      size='sm'
      isIconOnly
      variant='light'
      isLoading={isBusy}
      isDisabled={disabled}
      onPress={() => onAction(String(product._id))}
      className='rounded-none hover:bg-sidebar dark:hover:bg-sidebar text-xs uppercase text-foreground h-6 hover:border-sidebar dark:hover:text-rose-400'>
      <Icon name='trash' className='size-3.5' />
    </Button>
  </article>
)

export const FireCollectionManager = () => {
  const {user} = useAuthCtx()
  const createFireCollection = useMutation(api.admin.m.createFireCollection)
  const updateFireCollection = useMutation(api.admin.m.updateFireCollection)
  const deleteFireCollection = useMutation(api.admin.m.deleteFireCollection)
  const fireCollections = useQuery(api.admin.q.getFireCollectionsConfig, {})
  const categories = useQuery(api.categories.q.listCategories, {})
  const libraryProducts = useQuery(api.products.q.listProducts, {limit: 500})
  const [fireState, setFireState] = useQueryStates(fireCollectionStateParsers)
  const selectedCollectionId = fireState.fireCollectionId ?? null
  const createTitle = fireState.fireCreateTitle
  const collectionTitle = fireState.fireCollectionTitle
  const query = fireState.fireQuery
  const randomCategorySlug = fireState.fireRandomCategory
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
      if (selectedCollectionId !== null) {
        void setFireState({
          fireCollectionId: null,
          fireCollectionTitle: '',
        })
      }
      return
    }

    if (
      selectedCollectionId === null ||
      !fireCollections.some(
        (collection) => collection.id === selectedCollectionId,
      )
    ) {
      void setFireState({fireCollectionId: fireCollections[0].id})
    }
  }, [fireCollections, selectedCollectionId, setFireState])

  const selectedCollection = useMemo(
    () =>
      fireCollections?.find(
        (collection) => collection.id === selectedCollectionId,
      ) ?? null,
    [fireCollections, selectedCollectionId],
  )

  useEffect(() => {
    const nextTitle = selectedCollection?.title ?? ''
    if (collectionTitle === nextTitle) {
      return
    }

    void setFireState({fireCollectionTitle: nextTitle})
  }, [
    collectionTitle,
    selectedCollection?.id,
    selectedCollection?.title,
    setFireState,
  ])

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

  const randomCategoryOptions = useMemo(() => {
    const productCategorySlugs = new Set(
      (libraryProducts ?? [])
        .map((product) => product.categorySlug?.trim())
        .filter((slug): slug is string => Boolean(slug)),
    )

    const options = (categories ?? [])
      .filter(
        (category) =>
          !!category.slug && productCategorySlugs.has(category.slug),
      )
      .map((category) => ({
        value: category.slug!,
        label: category.name?.trim() || formatCategoryLabel(category.slug!),
      }))

    const knownValues = new Set(options.map((option) => option.value))
    const missingOptions = [...productCategorySlugs]
      .filter((slug) => !knownValues.has(slug))
      .sort((a, b) => a.localeCompare(b))
      .map((slug) => ({
        value: slug,
        label: formatCategoryLabel(slug),
      }))

    return [
      {value: RANDOM_CATEGORY_ALL, label: 'Random'},
      ...options.sort((a, b) => a.label.localeCompare(b.label)),
      ...missingOptions,
    ]
  }, [categories, libraryProducts])

  useEffect(() => {
    if (
      randomCategorySlug !== RANDOM_CATEGORY_ALL &&
      !randomCategoryOptions.some(
        (option) => option.value === randomCategorySlug,
      )
    ) {
      void setFireState({fireRandomCategory: RANDOM_CATEGORY_ALL})
    }
  }, [randomCategoryOptions, randomCategorySlug, setFireState])
  const randomCandidateProductIds = useMemo(() => {
    if (!libraryProducts) {
      return []
    }

    return libraryProducts
      .filter((product) => !selectedIdSet.has(String(product._id)))
      .filter(
        (product) =>
          randomCategorySlug === RANDOM_CATEGORY_ALL ||
          product.categorySlug === randomCategorySlug,
      )
      .map((product) => String(product._id))
  }, [libraryProducts, randomCategorySlug, selectedIdSet])
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
      await setFireState({
        fireCreateTitle: '',
        fireCollectionId: result.collectionId,
      })
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
    await setFireState({fireCollectionId: nextSelection})
  }

  const handleInsertRandomProducts = async () => {
    if (!selectedCollection || !libraryProducts) return
    if (randomCandidateProductIds.length === 0) {
      return
    }

    const randomProductIds = pickRandomProductIds(
      randomCandidateProductIds,
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
    <section className='flex w-full flex-col gap-4'>
      <div className='flex flex-col gap-2 border-b-2 border-foreground/10 p-2 max-h-23'>
        <div className='flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between'>
          <div className='flex items-center justify-between w-full'>
            <div>
              <div className='flex items-center space-x-4'>
                <h2 className='text-xl font-clash font-semibold text-foreground'>
                  Collection Creator
                </h2>

                <div className='flex flex-wrap items-center gap-3 text-[8px] uppercase tracking-widest text-foreground/45'>
                  <span className='text-indigo-500 dark:text-indigo-400'>
                    {fireCollections?.length ?? 0} collections
                  </span>
                  <span className='text-emerald-600 dark:text-emerald-400'>
                    {enabledCollectionsCount} enabled
                  </span>
                </div>
                <div className='flex flex-wrap items-center gap-3 text-[8px] uppercase tracking-widest text-foreground/45'>
                  {status === 'saved' && (
                    <span className='text-emerald-500'>Saved</span>
                  )}
                  {status === 'error' && (
                    <span className='text-destructive'>Save failed</span>
                  )}
                </div>
              </div>

              <p className='mt-1 overflow-scroll text-sm text-foreground/60 font-okxs tracking-wide'>
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
        <section className='flex min-h-0 flex-col bg-background/0'>
          <div className='flex items-center justify-between h-8'>
            <h3 className='text-[8px] pl-3 font-okxs font-light uppercase tracking-[0.2em] text-foreground/70'>
              Collections
            </h3>
            {/*<span className='text-xs text-foreground/45'>Select one</span>*/}
          </div>

          <ScrollArea className='mt-4 max-h-[36.01rem] pr-3'>
            <div className='flex flex-col gap-0'>
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
                    onClick={() => {
                      void setFireState({fireCollectionId: collection.id})
                    }}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      isSelected
                        ? 'border-foreground/30 bg-sidebar dark:bg-sidebar/30 shadow-inner'
                        : 'border-foreground/15 bg-background/80 hover:border-foreground/20'
                    }`}>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h3 className='truncate font-clash text-sm font-semibold tracking-wider text-foreground/80'>
                          <span>{collection.title}</span>

                          <span className='ml-2'>
                            <span className='font-ios font-thin opacity-30'>{`(`}</span>
                            <span className='font-medium'>
                              {collection.productIds.length}
                            </span>
                            <span className='font-ios font-thin opacity-30'>{`)`}</span>
                          </span>
                        </h3>
                        {/*<p className='mt-1 text-xs uppercase tracking-[0.22em] text-foreground/45'>
                          {collection.productIds.length}
                        </p>*/}
                      </div>
                      <div
                        className={`flex items-center justify-center rounded-sm px-1 py-0 text-[8.5px] uppercase font-clash font-black tracking-widest ${
                          collection.enabled
                            ? 'text-emerald-100 dark:text-emerald-500 bg-emerald-500 dark:bg-emerald-400/15'
                            : 'bg-zinc-500/10 dark:bg-sidebar/0 text-zinc-500 dark:text-foreground/60'
                        }`}>
                        <span
                          className={cn({
                            'drop-shadow-2xs': collection.enabled,
                          })}>
                          {collection.enabled ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </section>

        <div className='space-y-1'>
          <section className='flex flex-col bg-background/0 p-0'>
            <div className='flex items-center justify-between h-8'>
              <h3 className='text-[8px] font-okxs font-light uppercase tracking-[0.2em] text-foreground/70'>
                Settings
              </h3>
              {selectedCollection && (
                <div className='flex items-center space-x-2'>
                  <div className='flex items-center space-x-2 bg-background/80 dark:bg-background/0'>
                    <div>
                      {selectedCollection.enabled ? (
                        <p className='text-xs uppercase font-ios font-semibold tracking-widest text-emerald-600'>
                          On
                        </p>
                      ) : (
                        <p className='text-xs uppercase font-clash font-semibold tracking-widest text-zinc-400'>
                          Off
                        </p>
                      )}
                    </div>
                    <Switch
                      isSelected={selectedCollection.enabled}
                      isDisabled={activeKey !== null}
                      onValueChange={handleToggleCollection}
                      className='scale-75'
                      size='sm'
                    />
                  </div>

                  <Button
                    size='sm'
                    isIconOnly
                    radius='none'
                    variant='light'
                    color='danger'
                    isDisabled={activeKey !== null}
                    onPress={handleDeleteCollection}
                    className='rounded-xs font-okxs text-xs uppercase tracking-widest h-6 dark:text-rose-400 text-rose-600 dark:hover:bg-rose-400/10'>
                    <Icon name='trash' className='size-4' />
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
                <div className='flex items-center gap-2'>
                  <Input
                    value={collectionTitle}
                    onValueChange={(value) => {
                      void setFireState({fireCollectionTitle: value})
                    }}
                    placeholder='Collection title'
                    classNames={narrowInputClassNames}
                  />
                  <Button
                    size='sm'
                    isIconOnly
                    radius='none'
                    variant='flat'
                    isDisabled={
                      activeKey !== null ||
                      collectionTitle.trim().length === 0 ||
                      collectionTitle.trim() === selectedCollection.title
                    }
                    onPress={handleSaveCollectionTitle}
                    className='rounded-xs px-4 font-clash font-medium text-sm tracking-widest bg-dark-table text-white'>
                    <Icon name='save' className='size-4' />
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className='flex flex-col rounded-sm border border-foreground/10 bg-background/70 p-4 h-fit'>
            <div className='flex items-center justify-between gap-3'>
              <h3 className='text-[8px] font-okxs font-light uppercase tracking-[0.2em] text-foreground/70'>
                Current Collection
              </h3>
              <span className='font-okxs text-xs tracking-wider text-foreground/45'>
                renders in-order
              </span>
            </div>

            <ScrollArea className='mt-4 xl:flex-1'>
              <div className='grid md:grid-cols-2 gap-3'>
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
              <h3 className='text-[8px] font-okxs font-light uppercase tracking-[0.2em] text-foreground/70'>
                Product Library
              </h3>
              <span className=' font-okxs tracking-wide text-xs text-foreground/40'>
                up to {MAX_LIBRARY_RESULTS} matches
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
                randomCandidateProductIds.length === 0
              }
              isLoading={
                selectedCollection !== null &&
                activeKey === `random:${selectedCollection.id}`
              }
              onPress={handleInsertRandomProducts}
              className='rounded-sm px-4 font-clash font-normal tracking-wider text-sm bg-sidebar text-foreground'>
              Add {RANDOM_INSERT_COUNT} Random
            </Button>
          </div>

          <ScrollArea className='h-[70lvh] overflow-scroll'>
            <div className='mt-2 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Select
                label='Source Category'
                placeholder='Random category'
                selectedKeys={[randomCategorySlug]}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0]
                  void setFireState({
                    fireRandomCategory:
                      typeof key === 'string' ? key : RANDOM_CATEGORY_ALL,
                  })
                }}
                classNames={narrowSelectClassNames}
                disallowEmptySelection
                items={randomCategoryOptions}>
                {(item) => (
                  <SelectItem key={item.value} textValue={item.label}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>

              <span className='pb-1 text-[8px] uppercase tracking-[0.22em] text-foreground/50 text-center text-balance'>
                {randomCandidateProductIds.length} eligible for random pick
              </span>
            </div>

            <Input
              value={query}
              onValueChange={(value) => {
                void setFireState({fireQuery: value})
              }}
              placeholder='Search products by name, brand, category, or slug'
              classNames={narrowInputClassNames}
              className='mt-4'
            />

            <div className='mt-4 xl:flex-1'>
              <div className='grid md:grid-cols-2 gap-3'>
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
            </div>
          </ScrollArea>
        </section>
      </div>
    </section>
  )
}
