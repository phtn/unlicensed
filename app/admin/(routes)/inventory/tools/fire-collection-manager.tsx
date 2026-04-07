'use client'

import {narrowSelectClassNames} from '@/app/admin/_components/ui/fields'
import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useConvexSnapshotQuery} from '@/hooks/use-convex-snapshot-query'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {cn} from '@/lib/utils'
import {Button, Label, ListBox, Select, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {parseAsString, useQueryStates} from 'nuqs'
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {Input} from '@/components/hero-v3/input'
import {LegacyImage as Image} from '@/components/ui/legacy-image'

const MAX_LIBRARY_RESULTS = 24
const RANDOM_INSERT_COUNT = 15
const FILTER_OPTION_ALL = '__all__'
const RANDOM_CATEGORY_ALL = FILTER_OPTION_ALL
const fireCollectionStateParsers = {
  fireCollectionId: parseAsString,
  fireCreateTitle: parseAsString.withDefault(''),
  fireCollectionTitle: parseAsString.withDefault(''),
  fireQuery: parseAsString.withDefault(''),
  fireLibraryCategory: parseAsString.withDefault(FILTER_OPTION_ALL),
  fireLibraryBrand: parseAsString.withDefault(FILTER_OPTION_ALL),
  fireLibrarySubcategory: parseAsString.withDefault(FILTER_OPTION_ALL),
  fireLibraryProductType: parseAsString.withDefault(FILTER_OPTION_ALL),
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
    product.subcategory,
    product.productType,
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

const getUniqueFilterValues = (
  values: Iterable<string | null | undefined>,
): string[] =>
  [
    ...new Set(
      Array.from(values, (value) => value?.trim()).filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ].sort((left, right) => left.localeCompare(right))

const areStringArraysEqual = (
  left?: readonly string[],
  right?: readonly string[],
) => {
  if (left === right) {
    return true
  }

  const leftLength = left?.length ?? 0
  if (leftLength !== (right?.length ?? 0)) {
    return false
  }

  for (let index = 0; index < leftLength; index += 1) {
    if (left?.[index] !== right?.[index]) {
      return false
    }
  }

  return true
}

type FireCollectionListItem = {
  enabled: boolean
  id: string
  productIds: string[]
  title: string
}

interface ProductTileProps {
  product: Doc<'products'>
  imageUrl?: string | null
  actionLabel?: string
  emptyLabel?: string
  onAction?: (productId: string) => void
  disabled?: boolean
  isBusy?: boolean
}

const ProductTile = ({
  product,
  imageUrl,
  emptyLabel = 'No image',
  onAction,
  actionLabel = 'Add',
  disabled = false,
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

    {onAction && (
      <Button
        size='sm'
        isIconOnly
        variant='outline'
        isDisabled={disabled}
        onPress={() => onAction(String(product._id))}
        className='rounded-none border-transparent hover:bg-sidebar dark:hover:bg-sidebar text-xs uppercase text-foreground h-6 hover:border-sidebar'>
        <Icon
          name={actionLabel?.toLowerCase() === 'add' ? 'plus' : 'trash'}
          className='size-3.5 m-auto'
        />
      </Button>
    )}
  </article>
)

const MemoizedProductTile = memo(
  ProductTile,
  (previousProps, nextProps) =>
    previousProps.imageUrl === nextProps.imageUrl &&
    previousProps.actionLabel === nextProps.actionLabel &&
    previousProps.disabled === nextProps.disabled &&
    previousProps.isBusy === nextProps.isBusy &&
    previousProps.product._id === nextProps.product._id &&
    previousProps.product.name === nextProps.product.name &&
    previousProps.product.categorySlug === nextProps.product.categorySlug &&
    areStringArraysEqual(previousProps.product.brand, nextProps.product.brand),
)

interface CollectionCardProps {
  collection: FireCollectionListItem
  isSelected: boolean
  onSelect: (collectionId: string) => void
}

const CollectionCard = memo(
  ({collection, isSelected, onSelect}: CollectionCardProps) => (
    <button
      type='button'
      onClick={() => onSelect(collection.id)}
      className={`rounded-xs border p-4 text-left transition-colors ${
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
  ),
  (previousProps, nextProps) =>
    previousProps.isSelected === nextProps.isSelected &&
    previousProps.collection.id === nextProps.collection.id &&
    previousProps.collection.title === nextProps.collection.title &&
    previousProps.collection.enabled === nextProps.collection.enabled &&
    previousProps.collection.productIds.length ===
      nextProps.collection.productIds.length,
)
CollectionCard.displayName = 'CollectionCard'

export const FireCollectionManager = () => {
  const {user} = useAuthCtx()
  const createFireCollection = useMutation(api.admin.m.createFireCollection)
  const updateFireCollection = useMutation(api.admin.m.updateFireCollection)
  const deleteFireCollection = useMutation(api.admin.m.deleteFireCollection)
  const {data: fireCollections, refresh: refreshFireCollections} =
    useConvexSnapshotQuery(api.admin.q.getFireCollectionsConfig, {})
  const categories = useQuery(api.categories.q.listCategories, {})
  const {data: libraryProducts} = useConvexSnapshotQuery(
    api.products.q.listProducts,
    {limit: 500},
  )
  const [fireState, setFireState] = useQueryStates(fireCollectionStateParsers)
  const selectedCollectionId = fireState.fireCollectionId ?? null
  const createTitle = fireState.fireCreateTitle
  const collectionTitle = fireState.fireCollectionTitle
  const query = fireState.fireQuery
  const libraryCategory = fireState.fireLibraryCategory
  const libraryBrand = fireState.fireLibraryBrand
  const librarySubcategory = fireState.fireLibrarySubcategory
  const libraryProductType = fireState.fireLibraryProductType
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [status, setStatus] = useState<null | 'saved' | 'error'>(null)
  const clearStatusTimeoutRef = useRef<number | null>(null)
  const selectedCollectionRef = useRef(selectedCollectionId)
  const selectedIdsRef = useRef<string[]>([])
  const lastSyncedCollectionIdRef = useRef<string | null>(null)
  const lastSyncedCollectionTitleRef = useRef('')

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
  const selectedSourceCategorySlug =
    selectedCollection?.sourceCategorySlug ?? RANDOM_CATEGORY_ALL

  useEffect(() => {
    selectedCollectionRef.current = selectedCollection?.id ?? null
  }, [selectedCollection?.id])

  useEffect(() => {
    const nextTitle = selectedCollection?.title ?? ''
    const nextCollectionId = selectedCollection?.id ?? null
    const didCollectionChange =
      lastSyncedCollectionIdRef.current !== nextCollectionId
    const didServerTitleChange =
      lastSyncedCollectionTitleRef.current !== nextTitle
    const shouldSyncTitle =
      collectionTitle !== nextTitle &&
      (didCollectionChange ||
        (didServerTitleChange &&
          collectionTitle === lastSyncedCollectionTitleRef.current))

    lastSyncedCollectionIdRef.current = nextCollectionId
    lastSyncedCollectionTitleRef.current = nextTitle

    if (shouldSyncTitle) {
      void setFireState({fireCollectionTitle: nextTitle})
    }
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

  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const libraryProductsById = useMemo(
    () =>
      new Map(
        (libraryProducts ?? []).map((product) => [
          String(product._id),
          product,
        ]),
      ),
    [libraryProducts],
  )
  const missingSelectedIds = useMemo(
    () =>
      selectedIds.filter((productId) => !libraryProductsById.has(productId)),
    [libraryProductsById, selectedIds],
  )

  const missingSelectedProducts = useQuery(
    api.products.q.getProductsByIds,
    missingSelectedIds.length > 0 ? {productIds: missingSelectedIds} : 'skip',
  )
  const missingSelectedProductsById = useMemo(
    () =>
      new Map(
        (missingSelectedProducts ?? []).map((product) => [
          String(product._id),
          product,
        ]),
      ),
    [missingSelectedProducts],
  )
  const selectedProducts = useMemo(
    () =>
      selectedIds.flatMap((productId) => {
        const product =
          libraryProductsById.get(productId) ??
          missingSelectedProductsById.get(productId)

        return product ? [product] : []
      }),
    [libraryProductsById, missingSelectedProductsById, selectedIds],
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
  const isSelectedProductsLoading =
    missingSelectedIds.length > 0 && missingSelectedProducts === undefined
  const categoryLabelBySlug = useMemo(
    () =>
      new Map(
        (categories ?? []).flatMap((category) => {
          const slug = category.slug?.trim()
          if (!slug) {
            return []
          }

          return [[slug, category.name?.trim() || formatCategoryLabel(slug)]]
        }),
      ),
    [categories],
  )

  const libraryCategoryOptions = useMemo(() => {
    const slugs = getUniqueFilterValues(
      (libraryProducts ?? []).map((product) => product.categorySlug),
    )

    return [
      {value: FILTER_OPTION_ALL, label: 'All categories'},
      ...slugs.map((slug) => ({
        value: slug,
        label: categoryLabelBySlug.get(slug) ?? formatCategoryLabel(slug),
      })),
    ]
  }, [categoryLabelBySlug, libraryProducts])

  const libraryBrandOptions = useMemo(
    () => [
      {value: FILTER_OPTION_ALL, label: 'All brands'},
      ...getUniqueFilterValues(
        (libraryProducts ?? []).flatMap((product) => product.brand ?? []),
      ).map((brand) => ({
        value: brand,
        label: formatCategoryLabel(brand),
      })),
    ],
    [libraryProducts],
  )

  const librarySubcategoryOptions = useMemo(
    () => [
      {value: FILTER_OPTION_ALL, label: 'All subcategories'},
      ...getUniqueFilterValues(
        (libraryProducts ?? []).map((product) => product.subcategory),
      ).map((subcategory) => ({
        value: subcategory,
        label: formatCategoryLabel(subcategory),
      })),
    ],
    [libraryProducts],
  )

  const libraryProductTypeOptions = useMemo(
    () => [
      {value: FILTER_OPTION_ALL, label: 'All product types'},
      ...getUniqueFilterValues(
        (libraryProducts ?? []).map((product) => product.productType),
      ).map((productType) => ({
        value: productType,
        label: formatCategoryLabel(productType),
      })),
    ],
    [libraryProducts],
  )

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

    const selectedOption =
      selectedSourceCategorySlug !== RANDOM_CATEGORY_ALL &&
      !knownValues.has(selectedSourceCategorySlug) &&
      !missingOptions.some(
        (option) => option.value === selectedSourceCategorySlug,
      )
        ? [
            {
              value: selectedSourceCategorySlug,
              label:
                categoryLabelBySlug.get(selectedSourceCategorySlug) ??
                formatCategoryLabel(selectedSourceCategorySlug),
            },
          ]
        : []

    return [
      {value: RANDOM_CATEGORY_ALL, label: 'Random'},
      ...options.sort((a, b) => a.label.localeCompare(b.label)),
      ...missingOptions,
      ...selectedOption,
    ]
  }, [
    categories,
    categoryLabelBySlug,
    libraryProducts,
    selectedSourceCategorySlug,
  ])

  useEffect(() => {
    const nextState: Partial<typeof fireState> = {}

    if (
      libraryCategory !== FILTER_OPTION_ALL &&
      !libraryCategoryOptions.some((option) => option.value === libraryCategory)
    ) {
      nextState.fireLibraryCategory = FILTER_OPTION_ALL
    }

    if (
      libraryBrand !== FILTER_OPTION_ALL &&
      !libraryBrandOptions.some((option) => option.value === libraryBrand)
    ) {
      nextState.fireLibraryBrand = FILTER_OPTION_ALL
    }

    if (
      librarySubcategory !== FILTER_OPTION_ALL &&
      !librarySubcategoryOptions.some(
        (option) => option.value === librarySubcategory,
      )
    ) {
      nextState.fireLibrarySubcategory = FILTER_OPTION_ALL
    }

    if (
      libraryProductType !== FILTER_OPTION_ALL &&
      !libraryProductTypeOptions.some(
        (option) => option.value === libraryProductType,
      )
    ) {
      nextState.fireLibraryProductType = FILTER_OPTION_ALL
    }

    if (Object.keys(nextState).length > 0) {
      void setFireState(nextState)
    }
  }, [
    libraryBrand,
    libraryBrandOptions,
    libraryCategory,
    libraryCategoryOptions,
    libraryProductType,
    libraryProductTypeOptions,
    librarySubcategory,
    librarySubcategoryOptions,
    setFireState,
  ])
  const randomCandidateProductIds = useMemo(() => {
    if (!libraryProducts) {
      return []
    }

    return libraryProducts
      .filter((product) => !selectedIdSet.has(String(product._id)))
      .filter(
        (product) =>
          selectedSourceCategorySlug === RANDOM_CATEGORY_ALL ||
          product.categorySlug === selectedSourceCategorySlug,
      )
      .map((product) => String(product._id))
  }, [libraryProducts, selectedIdSet, selectedSourceCategorySlug])
  const filteredLibraryProducts = useMemo(() => {
    if (!libraryProducts) {
      return []
    }

    return libraryProducts
      .filter((product) => !selectedIdSet.has(String(product._id)))
      .filter(
        (product) =>
          libraryCategory === FILTER_OPTION_ALL ||
          product.categorySlug === libraryCategory,
      )
      .filter(
        (product) =>
          libraryBrand === FILTER_OPTION_ALL ||
          product.brand?.includes(libraryBrand),
      )
      .filter(
        (product) =>
          librarySubcategory === FILTER_OPTION_ALL ||
          product.subcategory === librarySubcategory,
      )
      .filter(
        (product) =>
          libraryProductType === FILTER_OPTION_ALL ||
          product.productType === libraryProductType,
      )
      .filter((product) => matchesSearch(product, deferredQuery))
  }, [
    deferredQuery,
    libraryBrand,
    libraryCategory,
    libraryProductType,
    libraryProducts,
    librarySubcategory,
    selectedIdSet,
  ])

  const availableProducts = useMemo(
    () => filteredLibraryProducts.slice(0, MAX_LIBRARY_RESULTS),
    [filteredLibraryProducts],
  )

  const hasActiveLibraryFilters =
    query.trim().length > 0 ||
    libraryCategory !== FILTER_OPTION_ALL ||
    libraryBrand !== FILTER_OPTION_ALL ||
    librarySubcategory !== FILTER_OPTION_ALL ||
    libraryProductType !== FILTER_OPTION_ALL

  const enabledCollectionsCount = useMemo(
    () =>
      fireCollections?.filter((collection) => collection.enabled).length ?? 0,
    [fireCollections],
  )

  const showSavedStatus = useCallback(() => {
    setStatus('saved')
    if (clearStatusTimeoutRef.current) {
      window.clearTimeout(clearStatusTimeoutRef.current)
    }
    clearStatusTimeoutRef.current = window.setTimeout(() => {
      setStatus(null)
    }, 2200)
  }, [])

  const runMutation = useCallback(
    async (
      key: string,
      action: () => Promise<unknown>,
      options?: {
        onSuccess?: () => Promise<void> | void
      },
    ) => {
      setActiveKey(key)
      setStatus(null)

      try {
        await action()
        await refreshFireCollections()
        await options?.onSuccess?.()
        showSavedStatus()
      } catch (error) {
        console.error('Failed to update collections', error)
        setStatus('error')
      } finally {
        setActiveKey(null)
      }
    },
    [refreshFireCollections, showSavedStatus],
  )

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

  const persistCollectionProducts = useCallback(
    async (nextProductIds: string[], productId: string) => {
      const collectionId = selectedCollectionRef.current
      if (!collectionId) {
        return
      }

      await runMutation(`product:${productId}`, () =>
        updateFireCollection({
          collectionId,
          patch: {productIds: nextProductIds},
          uid: user?.uid ?? 'anonymous',
        }),
      )
    },
    [runMutation, updateFireCollection, user?.uid],
  )

  const handleSelectCollection = useCallback(
    (collectionId: string) => {
      void setFireState({fireCollectionId: collectionId})
    },
    [setFireState],
  )

  const handleAddProduct = useCallback(
    (productId: string) => {
      const nextSelectedIds = selectedIdsRef.current
      if (nextSelectedIds.includes(productId)) {
        return
      }

      void persistCollectionProducts([...nextSelectedIds, productId], productId)
    },
    [persistCollectionProducts],
  )

  const handleRemoveProduct = useCallback(
    (productId: string) => {
      void persistCollectionProducts(
        selectedIdsRef.current.filter((selectedId) => selectedId !== productId),
        productId,
      )
    },
    [persistCollectionProducts],
  )

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

  const handleUpdateSourceCategory = async (nextCategorySlug: string) => {
    if (!selectedCollection) {
      return
    }

    const normalizedCategorySlug =
      nextCategorySlug === RANDOM_CATEGORY_ALL ? null : nextCategorySlug

    if (
      (selectedCollection.sourceCategorySlug ?? null) === normalizedCategorySlug
    ) {
      return
    }

    await runMutation(`source:${selectedCollection.id}`, () =>
      updateFireCollection({
        collectionId: selectedCollection.id,
        patch: {
          sourceCategorySlug: normalizedCategorySlug,
        },
        uid: user?.uid ?? 'anonymous',
      }),
    )
  }

  return (
    <section className='flex w-full flex-col gap-4'>
      <div className='flex flex-col gap-2 border-b-2 border-foreground/10 p-2'>
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
              onPress={handleCreateCollection}
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
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    isSelected={isSelected}
                    onSelect={handleSelectCollection}
                  />
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
                      onChange={handleToggleCollection}
                      className='scale-75'
                      size='sm'>
                      <Switch.Control
                        className={
                          selectedCollection.enabled
                            ? 'bg-emerald-600'
                            : 'bg-zinc-400'
                        }>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </div>

                  <Button
                    size='sm'
                    isIconOnly
                    variant='outline'
                    isDisabled={activeKey !== null}
                    onPress={handleDeleteCollection}
                    className='rounded-xs border-transparent h-6 dark:text-rose-400 text-rose-600 dark:hover:bg-rose-400/10'>
                    <Icon name='trash' className='size-4 m-auto' />
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
                    onChange={(e) => {
                      void setFireState({fireCollectionTitle: e.target.value})
                    }}
                    placeholder='Collection title'
                  />
                  <Button
                    size='sm'
                    isIconOnly
                    variant='tertiary'
                    isDisabled={
                      activeKey !== null ||
                      collectionTitle.trim().length === 0 ||
                      collectionTitle.trim() === selectedCollection.title
                    }
                    onPress={handleSaveCollectionTitle}
                    className='rounded-xs px-4 font-clash font-medium text-sm tracking-widest bg-dark-table text-white'>
                    <Icon name='save' className='size-4 m-auto' />
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
                  selectedProducts.length === 0 &&
                  isSelectedProductsLoading && (
                    <div className='rounded-2xl border border-dashed border-foreground/15 px-4 py-8 text-center text-sm text-foreground/55'>
                      Loading current collection...
                    </div>
                  )}

                {selectedProducts.map((product) => (
                  <MemoizedProductTile
                    key={product._id}
                    product={product}
                    imageUrl={resolveProductImage(product.image, resolveUrl)}
                    actionLabel='Remove'
                    disabled={activeKey !== null || !selectedCollection}
                    isBusy={activeKey === `product:${String(product._id)}`}
                    onAction={handleRemoveProduct}
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
              variant='tertiary'
              isDisabled={
                activeKey !== null ||
                !selectedCollection ||
                libraryProducts === undefined ||
                randomCandidateProductIds.length === 0
              }
              onPress={handleInsertRandomProducts}
              className='rounded-sm px-4 font-clash font-normal tracking-wider text-sm bg-sidebar text-foreground'>
              Add {RANDOM_INSERT_COUNT} Random
            </Button>
          </div>

          <ScrollArea className='h-[70lvh] overflow-scroll'>
            <div className='mt-2 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <Select
                value={selectedSourceCategorySlug}
                onChange={(key) => {
                  if (key === null) return
                  void handleUpdateSourceCategory(
                    typeof key === 'string' ? key : RANDOM_CATEGORY_ALL,
                  )
                }}
                isDisabled={activeKey !== null || !selectedCollection}
                className={narrowSelectClassNames.mainWrapper}>
                <Label className={narrowSelectClassNames.label}>
                  Source Category
                </Label>
                <Select.Trigger className={narrowSelectClassNames.trigger}>
                  <Select.Value className={narrowSelectClassNames.value} />
                  <Select.Indicator
                    className={narrowSelectClassNames.selectIndicator}
                  />
                </Select.Trigger>
                <Select.Popover className={narrowSelectClassNames.popover}>
                  <ListBox className={narrowSelectClassNames.listbox}>
                    {randomCategoryOptions.map((item) => (
                      <ListBox.Item
                        className={narrowSelectClassNames.listboxItem}
                        key={item.value}
                        id={item.value}
                        textValue={item.label}>
                        {item.label}
                        <ListBox.ItemIndicator className='text-foreground size-2.5' />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <span className='pb-1 text-[8px] uppercase tracking-[0.22em] text-foreground/50 text-center text-balance'>
                {randomCandidateProductIds.length} eligible for random pick
              </span>
            </div>

            <Input
              value={query}
              onChange={(e) => {
                void setFireState({fireQuery: e.target.value})
              }}
              placeholder='Search products by name, brand, category, subtype, or slug'
              className='mt-4'
            />

            <div className='mt-3 grid gap-3 md:grid-cols-2'>
              <Select
                value={libraryCategory}
                onChange={(key) => {
                  if (key === null) return
                  void setFireState({
                    fireLibraryCategory:
                      typeof key === 'string' ? key : FILTER_OPTION_ALL,
                  })
                }}
                className={narrowSelectClassNames.mainWrapper}>
                <Label className={narrowSelectClassNames.label}>Category</Label>
                <Select.Trigger className={narrowSelectClassNames.trigger}>
                  <Select.Value className={narrowSelectClassNames.value} />
                  <Select.Indicator
                    className={narrowSelectClassNames.selectIndicator}
                  />
                </Select.Trigger>
                <Select.Popover className={narrowSelectClassNames.popover}>
                  <ListBox className={narrowSelectClassNames.listbox}>
                    {libraryCategoryOptions.map((item) => (
                      <ListBox.Item
                        key={item.value}
                        id={item.value}
                        textValue={item.label}
                        className={narrowSelectClassNames.listboxItem}>
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                value={libraryBrand}
                onChange={(key) => {
                  if (key === null) return
                  void setFireState({
                    fireLibraryBrand:
                      typeof key === 'string' ? key : FILTER_OPTION_ALL,
                  })
                }}
                className={narrowSelectClassNames.mainWrapper}>
                <Label className={narrowSelectClassNames.label}>Brand</Label>
                <Select.Trigger className={narrowSelectClassNames.trigger}>
                  <Select.Value className={narrowSelectClassNames.value} />
                  <Select.Indicator
                    className={narrowSelectClassNames.selectIndicator}
                  />
                </Select.Trigger>
                <Select.Popover className={narrowSelectClassNames.popover}>
                  <ListBox className={narrowSelectClassNames.listbox}>
                    {libraryBrandOptions.map((item) => (
                      <ListBox.Item
                        key={item.value}
                        id={item.value}
                        textValue={item.label}
                        className={narrowSelectClassNames.listboxItem}>
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                value={librarySubcategory}
                onChange={(key) => {
                  if (key === null) return
                  void setFireState({
                    fireLibrarySubcategory:
                      typeof key === 'string' ? key : FILTER_OPTION_ALL,
                  })
                }}
                className={narrowSelectClassNames.mainWrapper}>
                <Label className={narrowSelectClassNames.label}>
                  Subcategory
                </Label>
                <Select.Trigger className={narrowSelectClassNames.trigger}>
                  <Select.Value className={narrowSelectClassNames.value} />
                  <Select.Indicator
                    className={narrowSelectClassNames.selectIndicator}
                  />
                </Select.Trigger>
                <Select.Popover className={narrowSelectClassNames.popover}>
                  <ListBox className={narrowSelectClassNames.listbox}>
                    {librarySubcategoryOptions.map((item) => (
                      <ListBox.Item
                        key={item.value}
                        id={item.value}
                        textValue={item.label}
                        className={narrowSelectClassNames.listboxItem}>
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                value={libraryProductType}
                onChange={(key) => {
                  if (key === null) return
                  void setFireState({
                    fireLibraryProductType:
                      typeof key === 'string' ? key : FILTER_OPTION_ALL,
                  })
                }}
                className={narrowSelectClassNames.mainWrapper}>
                <Label className={narrowSelectClassNames.label}>
                  Product Type
                </Label>
                <Select.Trigger className={narrowSelectClassNames.trigger}>
                  <Select.Value className={narrowSelectClassNames.value} />
                  <Select.Indicator
                    className={narrowSelectClassNames.selectIndicator}
                  />
                </Select.Trigger>
                <Select.Popover className={narrowSelectClassNames.popover}>
                  <ListBox className={narrowSelectClassNames.listbox}>
                    {libraryProductTypeOptions.map((item) => (
                      <ListBox.Item
                        key={item.value}
                        id={item.value}
                        textValue={item.label}
                        className={narrowSelectClassNames.listboxItem}>
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className='mt-3 flex items-center justify-between gap-3'>
              <span className='text-[8px] uppercase tracking-[0.22em] text-foreground/50'>
                {filteredLibraryProducts.length} matching products
              </span>

              <Button
                size='sm'
                variant='tertiary'
                isDisabled={!hasActiveLibraryFilters}
                onPress={() => {
                  void setFireState({
                    fireQuery: '',
                    fireLibraryCategory: FILTER_OPTION_ALL,
                    fireLibraryBrand: FILTER_OPTION_ALL,
                    fireLibrarySubcategory: FILTER_OPTION_ALL,
                    fireLibraryProductType: FILTER_OPTION_ALL,
                  })
                }}
                className='rounded-xs px-0 font-okxs text-[10px] uppercase tracking-[0.22em] text-foreground/55'>
                Clear filters
              </Button>
            </div>

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
                      No products match the current filters.
                    </div>
                  )}

                {selectedCollection &&
                  availableProducts.map((product) => (
                    <MemoizedProductTile
                      key={product._id}
                      product={product}
                      imageUrl={resolveProductImage(product.image, resolveUrl)}
                      actionLabel='Add'
                      disabled={activeKey !== null}
                      isBusy={activeKey === `product:${String(product._id)}`}
                      onAction={handleAddProduct}
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
