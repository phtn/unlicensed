'use client'

import {FeaturedProducts} from '@/app/lobby/(store)/featured'
import {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
import {SectionHeader} from '../ui/section-header'
import {ProductCard} from './product-card'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

export const SuggestedCartItems = () => {
  const {user} = useAuth()

  // Fetch featured products
  const featuredRaw = useQuery(api.products.q.getFeaturedProducts, {limit: 5})

  // Fetch previously bought products
  const previousRaw = useQuery(
    api.products.q.getPreviouslyBoughtProducts,
    user?.uid ? {fid: user.uid, limit: 5} : 'skip',
  )

  const featured = useMemo(
    () => featuredRaw?.map((product) => adaptProduct(product)) ?? [],
    [featuredRaw],
  )
  const previous = useMemo(
    () => previousRaw?.map((product) => adaptProduct(product)) ?? [],
    [previousRaw],
  )

  // Get images
  const allImageIds = useMemo(() => {
    return [
      ...featured.map((p) => p.image),
      ...previous.map((p) => p.image),
    ].filter((image): image is string => !!image && !image.startsWith('http'))
  }, [featured, previous])

  const resolveUrl = useStorageUrls(allImageIds)

  // If loading or both empty, we can just return null or loading state
  // But EmptyCart handles the main empty message.
  if (!featuredRaw && !previousRaw) return null

  return (
    <div className='flex flex-col h-full gap-6 border-t border-foreground/15'>
      {/* Featured Section */}
      {featured.length > 0 && (
        <div className=''>
          <SectionHeader title='Featured Drops' className='p-4' />
          <div className='flex w-md md:w-2xl overflow-x-auto gap-1 md:gap-3 snap-x snap-mandatory scroll-smooth hide-scrollbar ml-3 pr-10'>
            {featured.map((product) => (
              <div
                key={product._id}
                className='snap-start min-w-50 max-w-50 bg-surface-highlight/50 rounded-xs overflow-hidden border border-foreground/10 flex flex-col group md:hover:border-foreground/20'>
                <ProductCard
                  product={product}
                  imageUrl={resolveUrl(product.image ?? '') ?? undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Section */}
      <FeaturedProducts featuredProducts={featured} />

      {/* Previous Section */}
      {previous.length > 0 && (
        <div className='space-y-3 w-3xl'>
          <SectionHeader title='Buy Again' className='px-4 w-md' />

          <div className='flex w-screen md:w-2xl overflow-x-auto gap-3 snap-x snap-mandatory scroll-smooth hide-scrollbar ml-3 pr-8'>
            {previous.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                imageUrl={resolveUrl(product.image ?? '') ?? undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ISuggestedItem {
  product: StoreProduct
  imageUrl: string
  onAdd: () => Promise<void> | undefined
}
// Used in commented JSX; keep for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for SuggestedItem UI
const SuggestedItem = ({product, imageUrl, onAdd}: ISuggestedItem) => {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      await onAdd()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className='snap-start min-w-64 max-w-64 bg-surface-highlight/50 rounded-xs overflow-hidden border border-foreground/10 flex flex-col group md:hover:border-foreground/20'>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={product.name}
          radius='none'
          shadow='none'
          className='aspect-square object-cover opacity-90 group-hover:opacity-100 transition-opacity'
        />
      ) : (
        <div className='min-h-64 w-auto aspect-auto flex items-center justify-center'>
          <Icon name='spinners-ring' />
        </div>
      )}
      <div className='p-3 flex flex-col flex-1 gap-2'>
        <div className='flex items-center justify-between'>
          <h4 className='font-polysans leading-tight line-clamp-2 tracking-tight'>
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
