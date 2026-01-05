'use client'

import type {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {useCart} from '@/hooks/use-cart'
import {adaptProduct, RawProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

type ProductWithId = StoreProduct & {
  _id: Id<'products'>
}

export const RecommendedProducts = () => {
  const {cart, addItem} = useCart()
  const productsQuery = useQuery(api.products.q.listProducts, {
    limit: 20,
  }) as Doc<'products'>[] | undefined

  // Get product IDs already in cart
  const cartProductIds = useMemo(() => {
    if (!cart?.items) return new Set<Id<'products'>>()
    return new Set(cart.items.map((item) => item.product._id))
  }, [cart])

  // Filter and adapt products
  const recommendedProducts = useMemo(() => {
    if (!productsQuery) return []

    const adapted = productsQuery
      .map((rawProduct) => {
        const productId = rawProduct._id
        return {
          rawId: productId,
          product: adaptProduct(rawProduct as RawProduct),
        }
      })
      .filter(({rawId, product}) => {
        // Filter out products already in cart and ensure product has required fields
        return !cartProductIds.has(rawId) && product.available && product.image
      })
      .map(({rawId, product}) => ({
        ...product,
        _id: rawId,
      }))
      .slice(0, 1) as ProductWithId[] // Show up to 3 recommended products

    return adapted
  }, [productsQuery, cartProductIds])

  const productImage = useQuery(
    api.products.q.getPrimaryImage,
    recommendedProducts[0]
      ? {
          id: recommendedProducts[0]._id,
        }
      : 'skip',
  )

  if (recommendedProducts.length === 0) {
    return null
  }

  const handleAddToCart = async (product: ProductWithId) => {
    try {
      await addItem(
        product._id,
        1,
        product.popularDenomination?.[0] ||
          product.availableDenominations?.[0] ||
          1,
      )
    } catch (error) {
      console.error('Failed to add product to cart:', error)
    }
  }

  return (
    <div className='mt-4'>
      <h2 className='md:text-xl md:px-2 font-medium tracking-tighter opacity-80 mb-2'>
        Recommended for you
      </h2>
      <div className='space-y-3'>
        {recommendedProducts.map((product) => (
          <Card
            key={product._id}
            className='rounded-xl bg-linear-to-l from-featured/15 via-light-gray/10 to-transparent dark:bg-dark-gray/15'
            shadow='none'>
            <CardBody className='p-0 md:p-6'>
              <div className='flex gap-4 items-center'>
                <div className='relative w-24 h-24 aspect-square shrink-0 rounded-xl overflow-hidden'>
                  {productImage ? (
                    <Image
                      radius='none'
                      src={productImage}
                      alt={product.name}
                      className='w-full h-full object-cover aspect-auto'
                    />
                  ) : null}
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-xl truncate'>
                    {product.name}
                  </h3>

                  <div className='flex items-center justify-between'>
                    <p className='text-base mt-1 font-space'>
                      ${formatPrice(product.priceCents)}
                    </p>

                    <Button
                      size='sm'
                      variant='shadow'
                      className='absolute bg-featured -space-x-1.5 top-2 right-2 font-medium shrink-0 flex text-white text-base'
                      onPress={() => handleAddToCart(product)}>
                      <Icon name='plus' className='size-5' />
                      Add<span className='md:flex hidden'> to your order</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
