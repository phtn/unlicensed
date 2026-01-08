'use client'

import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
import {SectionHeader} from '../ui/section-header'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

export const SuggestedCartItems = ({onClose}: {onClose: () => void}) => {
  const {user} = useAuth()
  const {addItem} = useCart()

  // Fetch featured products
  const featuredRaw = useQuery(api.products.q.getFeaturedProducts, {limit: 5})

  // Fetch previously bought products
  const previousRaw = useQuery(
    api.products.q.getPreviouslyBoughtProducts,
    user?.uid ? {firebaseId: user.uid, limit: 5} : 'skip',
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

  const handleAddToCart = async (productId: any) => {
    await addItem(productId, 1)
  }

  // If loading or both empty, we can just return null or loading state
  // But EmptyCart handles the main empty message.
  if (!featuredRaw && !previousRaw) return null

  return (
    <div className='flex flex-col gap-6 py-6 border-t border-foreground/5 w-full'>
      {/* Featured Section */}
      {featured.length > 0 && (
        <div className='space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <SectionHeader title='Featured Drops' className='px-4 w-md' />
          <div className='flex overflow-x-auto px-4 gap-3 pb-4 snap-x hide-scrollbar -mx-4 md:mx-0'>
            {featured.map((product) => (
              <SuggestedItem
                key={product._id}
                product={product}
                imageUrl={resolveUrl(product.image ?? '')}
                onAdd={() => handleAddToCart(product._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previous Section */}
      {previous.length > 0 && (
        <div className='space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100'>
          <SectionHeader title='Buy Again' className='px-4 w-md' />

          <div className='flex md:w-lg w-screen overflow-x-auto px-4 gap-3 pb-4 snap-x hide-scrollbar -mx-4 md:mx-0'>
            {previous.map((product) => (
              <SuggestedItem
                key={product._id}
                product={product}
                imageUrl={resolveUrl(product.image ?? '')}
                onAdd={() => handleAddToCart(product._id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const SuggestedItem = ({product, imageUrl, onAdd}: any) => {
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
    <div className='snap-start bg-surface-highlight/50 rounded-2xl overflow-hidden border border-foreground/5 flex flex-col group hover:border-foreground/10 transition-colors md:min-w-sm aspect-square'>
      <div className='relative w-full bg-white/5 aspect-square'>
        <Image
          src={imageUrl || '/default-product-image.svg'}
          alt={product.name}
          className='w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity'
        />
      </div>
      <div className='p-3 flex flex-col flex-1 gap-2'>
        <div className='flex items-center justify-between'>
          <h4 className='font-space font-medium leading-tight line-clamp-2 tracking-tight'>
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
