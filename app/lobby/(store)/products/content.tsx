'use client'

import {StoreProduct} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {ProductCard} from '@/components/store/product-card'
import {api} from '@/convex/_generated/api'
import {PotencyLevel} from '@/convex/products/d'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from 'nuqs'
import {Activity, useMemo} from 'react'

interface ContentProps {
  initialProducts: StoreProduct[]
}

type SortField = 'name' | 'price' | 'thc' | 'rating'
type SortOrder = 'asc' | 'desc'

export const Content = ({initialProducts}: ContentProps) => {
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

  // Fetch products
  const productsQuery = useQuery(api.products.q.listProducts, {limit: 200})
  const categoriesQuery = useQuery(api.categories.q.listCategories)

  // Adapt and filter products
  const allProducts = useMemo(() => {
    const nextProducts = productsQuery?.map(adaptProduct)
    return nextProducts && nextProducts.length > 0
      ? nextProducts
      : initialProducts
  }, [initialProducts, productsQuery])

  // Get unique values for filters
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>()
    allProducts.forEach((p) => {
      if (p.brand) {
        brands.add(p.brand.toLowerCase())
      }
    })
    return Array.from(brands).sort()
  }, [allProducts])

  const uniqueCategories = useMemo(() => {
    if (!categoriesQuery) return []
    return categoriesQuery.map((c) => ({
      slug: c.slug ?? '',
      name: c.name ?? '',
    }))
  }, [categoriesQuery])

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts]

    // Filter by brand
    if (brand) {
      filtered = filtered.filter(
        (p) => p.brand?.toLowerCase() === brand.toLowerCase(),
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
      const effectList = effects.split(',').map((e) => e.trim().toLowerCase())
      filtered = filtered.filter((p) =>
        effectList.some((effect) =>
          p.effects.some((e) => e.toLowerCase().includes(effect)),
        ),
      )
    }

    // Filter by terpenes
    if (terpenes) {
      const terpeneList = terpenes.split(',').map((t) => t.trim().toLowerCase())
      filtered = filtered.filter((p) =>
        terpeneList.some((terpene) =>
          p.terpenes.some((t) => t.toLowerCase().includes(terpene)),
        ),
      )
    }

    // Filter by flavor notes
    if (flavorNotes) {
      const flavorList = flavorNotes
        .split(',')
        .map((f) => f.trim().toLowerCase())
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

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return filteredProducts.map((product) => {
      if (!product.image || product.image.startsWith('http')) {
        return product
      }
      const resolvedUrl = resolveUrl(product.image)
      return {
        ...product,
        image: resolvedUrl || product.image,
      }
    })
  }, [filteredProducts, resolveUrl])

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

  return (
    <div className='min-h-screen overflow-x-hidden bg-background'>
      {/* Hero Section */}
      <section className='pt-16 md:pt-20 lg:pt-24 xl:pt-28 2xl:pt-36 pb-12 sm:pb-16 lg:pb-16 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto'>
          <Tag text='Products' />
          <Title title='All Products' subtitle='Discover Our Collection' />
          <p className='hidden text-sm sm:text-base lg:text-base opacity-60 mt-6 sm:mt-8 max-w-2xl leading-relaxed'>
            Browse our complete selection of premium products. Use filters to
            find exactly what you&apos;re looking for.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className='px-4 sm:px-6 pb-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='rounded-3xl bg-sidebar/40 dark:bg-sidebar border border-foreground/10 dark:border-dark-gray/50 p-4 sm:p-6'>
            {/* Search Bar */}
            <div className='mb-6'>
              <div className='relative'>
                <Icon
                  name='search'
                  className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-60'
                />
                <input
                  type='text'
                  placeholder='Search products...'
                  value={search || ''}
                  onChange={(e) => setSearch(e.target.value || null)}
                  className='w-full pl-16 pr-4 py-2.5 rounded-xl bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50'
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
              {/* Brand Filter */}
              <div>
                <label className='block text-xs font-medium mb-2 opacity-70'>
                  Brand
                </label>
                <select
                  value={brand || ''}
                  onChange={(e) => setBrand(e.target.value || null)}
                  className='w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm'>
                  <option value=''>All Brands</option>
                  {uniqueBrands.map((b) => (
                    <option key={b} value={b}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className='block text-xs font-medium mb-2 opacity-70'>
                  Category
                </label>
                <select
                  value={category || ''}
                  onChange={(e) => setCategory(e.target.value || null)}
                  className='w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm'>
                  <option value=''>All Categories</option>
                  {uniqueCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Potency Filter */}
              <div>
                <label className='block text-xs font-medium mb-2 opacity-70'>
                  Potency
                </label>
                <select
                  value={potency || ''}
                  onChange={(e) =>
                    setPotency((e.target.value as PotencyLevel) || undefined)
                  }
                  className='w-full px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm'>
                  <option value=''>All Levels</option>
                  <option value='mild'>Mild</option>
                  <option value='medium'>Medium</option>
                  <option value='high'>High</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className='block text-xs font-medium mb-2 opacity-70'>
                  Sort By
                </label>
                <div className='flex gap-2'>
                  <select
                    value={sortParams.sort}
                    onChange={(e) =>
                      setSortParams({sort: e.target.value as SortField})
                    }
                    className='flex-1 px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-brand/50 text-sm'>
                    <option value='name'>Name</option>
                    <option value='price'>Price</option>
                    <option value='thc'>THC %</option>
                    <option value='rating'>Rating</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortParams({
                        order: sortParams.order === 'asc' ? 'desc' : 'asc',
                      })
                    }
                    className='px-3 py-2 rounded-lg bg-background border border-foreground/10 dark:border-dark-gray/50 hover:bg-sidebar/50 transition-colors'>
                    <Icon
                      name={
                        sortParams.order === 'asc' ? 'arrow-up' : 'arrow-down'
                      }
                      className='size-4'
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <details className='mt-4'>
              <summary className='cursor-pointer text-sm font-medium opacity-70 hover:opacity-100 transition-opacity'>
                Advanced Filters
              </summary>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-foreground/10 dark:border-dark-gray/50'>
                {/* THC Range */}
                <div>
                  <label className='block text-xs font-medium mb-2 opacity-70'>
                    Min THC %
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
                  <label className='block text-xs font-medium mb-2 opacity-70'>
                    Max THC %
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
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-xs'>
                      Brand: {brand}
                      <button
                        onClick={() => setBrand(null)}
                        className='hover:opacity-70'>
                        <Icon name='x' className='size-3' />
                      </button>
                    </span>
                  )}
                  {category && (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-xs'>
                      Category: {category}
                      <button
                        onClick={() => setCategory(null)}
                        className='hover:opacity-70'>
                        <Icon name='x' className='size-3' />
                      </button>
                    </span>
                  )}
                  {potency && (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-xs'>
                      Potency: {potency}
                      <button
                        onClick={() => setPotency(null)}
                        className='hover:opacity-70'>
                        <Icon name='x' className='size-3' />
                      </button>
                    </span>
                  )}
                </div>
                <Button
                  size='sm'
                  variant='light'
                  onPress={clearFilters}
                  className='text-xs'>
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto'>
          <div className='mb-6 flex items-center justify-between'>
            <p className='text-sm opacity-60'>
              {productsWithImages.length} product
              {productsWithImages.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <Activity
            mode={productsWithImages.length === 0 ? 'visible' : 'hidden'}>
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
                    variant='light'
                    onPress={clearFilters}
                    className='mt-4'>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Activity>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8'>
            {productsWithImages.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
