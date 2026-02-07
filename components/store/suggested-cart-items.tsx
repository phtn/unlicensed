'use client'

import {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
import {SectionHeader} from '../ui/section-header'
import {CartCollection} from './cart-collection'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

export const SuggestedCartItems = ({onClose}: {onClose: VoidFunction}) => {
  const {user} = useAuth()
  const {addItem} = useCart()

  // Fetch featured products
  const featuredRaw = useQuery(api.products.q.getFeaturedProducts, {limit: 5})

  // Fetch previously bought products
  const previousRaw = useQuery(
    api.products.q.getPreviouslyBoughtProducts,
    user?.uid ? {fid: user.uid, limit: 5} : 'skip',
  )

  const featured = useMemo(
    () => featuredRaw?.map(adaptProduct) ?? [],
    [featuredRaw],
  )
  const previous = useMemo(
    () => previousRaw?.map(adaptProduct) ?? [],
    [previousRaw],
  )

  // Get images
  const allImageIds = useMemo(() => {
    return [
      ...featured.map((p) => p.image),
      ...previous.map((p) => p.image),
    ].filter(Boolean)
  }, [featured, previous])

  const resolveUrl = useStorageUrls(allImageIds)

  const handleAddToCart =
    (productId: Id<'products'> | undefined) => async () => {
      if (productId) {
        await addItem(productId, 1)
      }
    }

  // If loading or both empty, we can just return null or loading state
  // But EmptyCart handles the main empty message.
  if (!featuredRaw && !previousRaw) return null

  return (
    <div className='flex flex-col h-full gap-6 border-t border-foreground/15 w-full'>
      {/* Featured Section */}
      {featured.length > 0 && (
        <div className=''>
          <SectionHeader title='Featured Drops' className='p-4 w-full' />
          <div className='flex w-full overflow-x-auto pr-6 gap-3 snap-x snap-mandatory scroll-smooth hide-scrollbar ml-3'>
            {featured.map((product) => (
              <SuggestedItem
                key={product._id}
                product={product}
                imageUrl={resolveUrl(product.image ?? '') ?? ''}
                onAdd={handleAddToCart(product._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Collection Section */}
      <CartCollection />

      {/* Previous Section */}
      {previous.length > 0 && (
        <div className='space-y-3'>
          <SectionHeader title='Buy Again' className='px-4 w-md' />

          <div className='flex w-full overflow-x-auto pr-6 gap-3 snap-x snap-mandatory scroll-smooth hide-scrollbar ml-3'>
            {previous.map((product) => (
              <SuggestedItem
                key={product._id}
                product={product}
                imageUrl={resolveUrl(product.image ?? '') ?? ''}
                onAdd={handleAddToCart(product._id)}
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
    <div className='snap-start min-w-64 max-w-64 bg-surface-highlight/50 rounded-2xl overflow-hidden border border-foreground/10 flex flex-col group md:hover:border-foreground/20'>
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
