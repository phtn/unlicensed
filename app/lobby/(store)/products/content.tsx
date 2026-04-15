'use client'

import {StoreProduct} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {api} from '@/convex/_generated/api'
import {PotencyLevel} from '@/convex/products/d'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {adaptProduct, type RawProduct} from '@/lib/convexClient'
import {resolveProductImage} from '@/lib/resolve-product-image'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import type {FunctionReturnType} from 'convex/server'
import {
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from 'nuqs'
import {Activity, ChangeEvent, useCallback, useMemo} from 'react'
import {Products} from '../category/[slug]/products'

interface ContentProps {
  initialProducts: StoreProduct[]
}

type SortField = 'name' | 'price' | 'thc' | 'rating'
type SortOrder = 'asc' | 'desc'

export const Content = ({initialProducts}: ContentProps) => {
  type CategoriesQueryResult = FunctionReturnType<
    typeof api.categories.q.listCategories
  >
  type ProductsQueryResult = FunctionReturnType<
    typeof api.products.q.listProducts
  >

  // Query states for filters
  const [brand, setBrand] = useQueryState(
    'brand',
    parseAsString.withDefault(''),
  )
  const [category, setCategory] = useQueryState(
    'category',
    parseAsString.withDefault(''),
  )
  const [potency, setPotency] = useQueryState(
    'potency',
    parseAsStringEnum<PotencyLevel>(['mild', 'medium', 'high']),
  )
  const [minThc, setMinThc] = useQueryState(
    'minThc',
    parseAsString.withDefault(''),
  )
  const [maxThc, setMaxThc] = useQueryState(
    'maxThc',
    parseAsString.withDefault(''),
  )
  const [effects, setEffects] = useQueryState(
    'effects',
    parseAsString.withDefault(''),
  )
  const [terpenes, setTerpenes] = useQueryState(
    'terpenes',
    parseAsString.withDefault(''),
  )
  const [flavorNotes, setFlavorNotes] = useQueryState(
    'flavorNotes',
    parseAsString.withDefault(''),
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  )
  const [sortParams, setSortParams] = useQueryStates({
    sort: parseAsStringEnum<SortField>([
      'name',
      'price',
      'thc',
      'rating',
    ]).withDefault('name'),
    order: parseAsStringEnum<SortOrder>(['asc', 'desc']).withDefault('asc'),
  })

  const categoriesQuery = useQuery(api.categories.q.listCategories) as
    | CategoriesQueryResult
    | undefined
  const productsQuery = useQuery(api.products.q.listProducts, {
    limit: 100,
  }) as ProductsQueryResult | undefined

  const allProducts = useMemo<StoreProduct[]>(
    () =>
      productsQuery
        ? productsQuery.map((product: RawProduct) => adaptProduct(product))
        : initialProducts,
    [initialProducts, productsQuery],
  )

  const getProductBrands = (brands?: string | string[]) =>
    Array.isArray(brands) ? brands : brands ? [brands] : []

  // Get unique values for filters
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>()
    allProducts.forEach((p: StoreProduct) => {
      getProductBrands(p.brand).forEach((productBrand) => {
        brands.add(productBrand.toLowerCase())
      })
    })
    return Array.from(brands).toSorted()
  }, [allProducts])

  const uniqueCategories = useMemo(() => {
    if (!categoriesQuery) return []
    return categoriesQuery.map((c: CategoriesQueryResult[number]) => ({
      slug: c.slug ?? '',
      name: c.name ?? '',
    }))
  }, [categoriesQuery])

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts]

    // Filter by brand
    if (brand) {
      filtered = filtered.filter((p) =>
        getProductBrands(p.brand).some(
          (productBrand) => productBrand.toLowerCase() === brand.toLowerCase(),
        ),
      )
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter((p) => p.categorySlug === category)
    }

    // Filter by potency
    if (potency) {
      filtered = filtered.filter((p) => p.potencyLevel === potency)
    }

    // Filter by THC range
    if (minThc) {
      const min = parseFloat(minThc)
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => p.thcPercentage >= min)
      }
    }
    if (maxThc) {
      const max = parseFloat(maxThc)
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => p.thcPercentage <= max)
      }
    }

    // Filter by effects
    if (effects) {
      const effectList = effects
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
      filtered = filtered.filter((p) =>
        effectList.some((effect) =>
          p.effects.some((e: string) => e.toLowerCase().includes(effect)),
        ),
      )
    }

    // Filter by terpenes
    if (terpenes) {
      const terpeneList = terpenes
        .split(',')
        .map((t: string) => t.trim().toLowerCase())
      filtered = filtered.filter((p) =>
        terpeneList.some((terpene) =>
          p.terpenes.some((t: string) => t.toLowerCase().includes(terpene)),
        ),
      )
    }

    // Filter by flavor notes
    if (flavorNotes) {
      const flavorList = flavorNotes
        .split(',')
        .map((f: string) => f.trim().toLowerCase())
      filtered = filtered.filter((p) =>
        flavorList.some((flavor) =>
          p.flavorNotes.some((f) => f.toLowerCase().includes(flavor)),
        ),
      )
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.shortDescription.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower),
      )
    }

    // Sort products
    const {sort, order} = sortParams
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = a.priceCents - b.priceCents
          break
        case 'thc':
          comparison = a.thcPercentage - b.thcPercentage
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
      }
      return order === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [
    allProducts,
    brand,
    category,
    potency,
    minThc,
    maxThc,
    effects,
    terpenes,
    flavorNotes,
    search,
    sortParams,
  ])

  // Get image IDs for URL resolution
  const imageIds = useMemo(
    () =>
      filteredProducts
        .map((p) => p.image)
        .filter((img): img is string => !!img && !img.startsWith('http')),
    [filteredProducts],
  )

  const resolveUrl = useStorageUrls(imageIds)

  // Clear all filters
  const clearFilters = async () => {
    await Promise.all([
      setBrand(null),
      setCategory(null),
      setPotency(null),
      setMinThc(null),
      setMaxThc(null),
      setEffects(null),
      setTerpenes(null),
      setFlavorNotes(null),
      setSearch(null),
    ])
  }

  const hasActiveFilters =
    brand ||
    category ||
    potency ||
    minThc ||
    maxThc ||
    effects ||
    terpenes ||
    flavorNotes ||
    search

  const handleBrandChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setBrand(e.target.value || null)
  }

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value || null)
  }

  const handlePotencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPotency((e.target.value || null) as PotencyLevel | null)
  }

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortParams({sort: (e.target.value || 'name') as SortField})
  }
  const getImageUrl = useCallback(
    (image: string | null | undefined) =>
      resolveProductImage(image, resolveUrl),
    [resolveUrl],
  )

  return (
    <div className='min-h-screen overflow-x-hidden bg-background'>
      {/* Hero Section */}
      <section className='pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-36 pb-10 sm:pb-16 lg:pb-16 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto'>
          <Tag text='Search' />
          <Title title='Products' subtitle='Advanced Search' />
          <p className='hidden text-sm sm:text-base lg:text-base opacity-60 mt-6 sm:mt-8 max-w-2xl leading-relaxed'>
            Browse our complete selection of premium products. Use filters to
            find exactly what you&apos;re looking for.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className='px-4 sm:px-6 pb-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='rounded-3xl bg-sidebar/40 dark:bg-sidebar border border-foreground/10 dark:border-dark-gray/50 p-4 sm:px-6 sm:py-8'>
            {/* Search Bar */}
            <div className='mb-6'>
              <div className='relative'>
                <Icon
                  name='search'
                  className='absolute left-2.75 top-[6.25px] size-4.5 opacity-60'
                />
                <input
                  type='text'
                  placeholder='Search products...'
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value || null)}
                  className='w-full pl-12 pr-4 py-3 placeholder:text-base placeholder:opacity-80 rounded-lg bg-background border border-foreground/10 dark:border-background focus:outline-none focus:ring-2 focus:ring-brand/50'
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
              {/* Brand Filter */}
              <FilterSelector
                label='Brand'
                innerLabel='All Brands'
                value={brand || ''}
                onSelect={handleBrandChange}
                data={uniqueBrands}
              />
              {/* Category Filter */}
              <FilterSelector
                label='Category'
                innerLabel='All Categories'
                value={category || ''}
                onSelect={handleCategoryChange}
                data={uniqueCategories}
              />
              {/* Potency Filter */}
              <FilterSelector
                label='Potency'
                innerLabel='All Potencies'
                value={potency || ''}
                onSelect={handlePotencyChange}
                data={['mild', 'medium', 'high'] as PotencyLevel[]}
              />
              {/* Sort */}
              <FilterSelector
                label='Sort By'
                innerLabel='Name'
                value={sortParams.sort}
                onSelect={handleSortChange}
                data={['name', 'price', 'thc', 'rating'] as SortField[]}
              />
            </div>

            {/* Advanced Filters */}
            <details className='mt-6'>
              <summary className='cursor-pointer select-none ml-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity'>
                Advanced Filters
              </summary>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-foreground/10 dark:border-dark-gray/50'>
                {/* THC Range */}
                <div>
                  <label className='block text-xs select-none font-medium mb-2 opacity-70'>
                    Min THC mg
                  </label>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={minThc || ''}
                    onChange={(e) => setMinThc(e.target.value || null)}
                    placeholder='0'
                    className='w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm'
                  />
                </div>
                <div>
                  <label className='block select-none text-xs font-medium mb-2 opacity-70'>
                    Max THC mg
                  </label>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    value={maxThc || ''}
                    onChange={(e) => setMaxThc(e.target.value || null)}
                    placeholder='100'
                    className='w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm'
                  />
                </div>
              </div>
            </details>

            {/* Active Filters & Clear */}
            {hasActiveFilters && (
              <div className='mt-4 pt-4 border-t border-foreground/10 dark:border-dark-gray/50 flex items-center justify-between flex-wrap gap-2'>
                <div className='flex flex-wrap gap-2'>
                  {brand && (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-xs capitalize'>
                      Brand: {brand}
                      <button
                        onClick={() => setBrand(null)}
                        className='hover:opacity-70'
                      >
                        <Icon name='x' className='size-3' />
                      </button>
                    </span>
                  )}
                  {category && (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/40 text-xs capitalize'>
                      Category:{' '}
                      <span className='font-semibold'>{category}</span>
                      <button
                        onClick={() => setCategory(null)}
                        className='hover:opacity-70'
                      >
                        <Icon name='x' className='size-3' />
                      </button>
                    </span>
                  )}
                  {potency && (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/40 text-xs capitalize'>
                      Potency: <span className='font-semibold'>{potency}</span>
                      <button
                        onClick={() => setPotency(null)}
                        className='hover:opacity-70'
                      >
                        <Icon name='x' className='size-3' />
                      </button>
                    </span>
                  )}
                </div>
                <Button
                  size='sm'
                  variant='tertiary'
                  onPress={clearFilters}
                  className='text-xs'
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className='py-6 sm:py-8 px-0 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-6 px-4 flex items-center justify-between'>
            <p className='text-sm opacity-60'>
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <Activity mode={filteredProducts.length === 0 ? 'visible' : 'hidden'}>
            <div className='max-w-7xl mx-auto pt-20'>
              <div className='flex flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
                <Title
                  titleStyle='lowercase'
                  title='No products found.'
                  subtitle={
                    <div className='flex items-center relative'>
                      <Icon
                        name='chevron-double-left'
                        className='rotate-90 size-12 text-featured opacity-100 relative z-30'
                      />
                      <span>try adjusting your filters</span>
                    </div>
                  }
                />
                {hasActiveFilters && (
                  <Button
                    size='lg'
                    variant='tertiary'
                    onPress={clearFilters}
                    className='mt-4'
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Activity>
          {/*<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                imageUrl={resolveProductImage(product.image, resolveUrl)}
              />
            ))}
          </div>*/}
        </div>

        <Products products={filteredProducts} getImageUrl={getImageUrl} />
      </section>
    </div>
  )
}

interface FilterSelectorProps {
  label: string
  innerLabel: string
  data: Array<{slug: string; name: string} | string>
  value: string
  onSelect: (e: ChangeEvent<HTMLSelectElement>) => void
}

const FilterSelector = ({
  label,
  innerLabel,
  data,
  value,
  onSelect,
}: FilterSelectorProps) => {
  return (
    <div>
      <label className='block select-none text-sm font-okxs font-medium ml-2 mb-2 opacity-70'>
        {label}
      </label>
      <div className='relative'>
        <select
          value={value}
          onChange={onSelect}
          className='w-full appearance-none rounded-lg border border-foreground/10 bg-background px-4 py-3 pr-10 text-sm font-okxs capitalize transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand/50 dark:bg-dark-table dark:border-background dark:text-white'
        >
          <option value=''>{innerLabel}</option>
          {data.map((b) => (
            <option
              key={typeof b === 'string' ? b : b.slug}
              value={typeof b === 'string' ? b : b.slug}
            >
              {typeof b === 'string' ? b : b.name}
            </option>
          ))}
        </select>
        <Icon
          name='selector'
          className='pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-60'
        />
      </div>
    </div>
  )
}
