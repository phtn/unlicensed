'use client'

import {REWARDS_CONFIG} from '@/app/lobby/(store)/cart/checkout/lib/rewards'
import type {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {
  isProductCartItemWithProduct,
  useCart,
} from '@/hooks/use-cart'
import {adaptProduct, RawProduct} from '@/lib/convexClient'
import {getUnitPriceCents} from '@/utils/cartPrice'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {memo, useMemo} from 'react'

type ProductWithId = StoreProduct & {
  _id: Id<'products'>
}

/** Price in cents for the lowest available denomination (cheapest entry point) */
function getLowestDenominationPriceCents(product: StoreProduct): number {
  const denoms = product.availableDenominations ?? [1]
  if (denoms.length === 0) return product.priceCents ?? 0
  let min = Infinity
  for (const d of denoms) {
    const p = getUnitPriceCents(product, d)
    if (p < min) min = p
  }
  return min === Infinity ? (product.priceCents ?? 0) : min
}

/** Smallest denomination value for display/add-to-cart */
function getLowestDenomination(product: StoreProduct): number {
  const denoms = product.availableDenominations ?? [1]
  if (denoms.length === 0) return 1
  return Math.min(...denoms)
}

export const RecommendedProducts = memo(() => {
  const {cart, addItem} = useCart()
  const productsQuery = useQuery(api.products.q.listProducts, {
    limit: 50,
  }) as Doc<'products'>[] | undefined

  // Get product IDs and category slugs already in cart
  const cartProductIds = useMemo(() => {
    if (!cart?.items) return new Set<Id<'products'>>()
    return new Set(
      cart.items.flatMap((item) => {
        if (isProductCartItemWithProduct(item)) return [item.product._id]
        return item.bundleItemsWithProducts.map((bi) => bi.productId)
      }),
    )
  }, [cart])

  const cartCategorySlugs = useMemo(() => {
    if (!cart?.items) return new Set<string>()
    return new Set(
      cart.items.flatMap((item) => {
        if (isProductCartItemWithProduct(item))
          return item.product.categorySlug ? [item.product.categorySlug] : []
        return item.bundleItemsWithProducts
          .map((bi) => bi.product.categorySlug)
          .filter((s): s is string => !!s)
      }),
    )
  }, [cart])

  const hasOnlyOneCategory = cartCategorySlugs.size === 1

  // Filter, adapt, sort by lowest denomination price, optionally restrict to different category
  const recommendedProducts = useMemo(() => {
    if (!productsQuery) return []

    const cartCategories = cartCategorySlugs
    const preferDifferentCategory =
      hasOnlyOneCategory && cartCategories.size > 0

    let filtered = productsQuery
      .map((rawProduct) => {
        const productId = rawProduct._id
        return {
          rawId: productId,
          product: adaptProduct(rawProduct as RawProduct),
        }
      })
      .filter(({rawId, product}) => {
        if (cartProductIds.has(rawId) || !product.available || !product.image)
          return false
        if (getLowestDenominationPriceCents(product) <= 0) return false
        if (preferDifferentCategory && product.categorySlug) {
          return !cartCategories.has(product.categorySlug)
        }
        return true
      })

    // Fallback: if we prefer different category but found none, show any category
    if (preferDifferentCategory && filtered.length === 0) {
      filtered = productsQuery
        .map((rawProduct) => ({
          rawId: rawProduct._id,
          product: adaptProduct(rawProduct as RawProduct),
        }))
        .filter(
          ({rawId, product}) =>
            !cartProductIds.has(rawId) &&
            product.available &&
            product.image &&
            getLowestDenominationPriceCents(product) > 0,
        )
    }

    const adapted = filtered
      .map(({rawId, product}) => ({
        ...product,
        _id: rawId,
      }))
      .sort(
        (a, b) =>
          getLowestDenominationPriceCents(a) -
          getLowestDenominationPriceCents(b),
      )
      .slice(0, 1) as ProductWithId[]

    return adapted
  }, [productsQuery, cartProductIds, cartCategorySlugs, hasOnlyOneCategory])

  if (recommendedProducts.length === 0) {
    return null
  }

  const handleAddToCart = async (product: ProductWithId) => {
    const denomination =
      product.popularDenomination?.[0] ??
      product.availableDenominations?.[0] ??
      getLowestDenomination(product)
    try {
      await addItem(product._id, 1, denomination)
    } catch (error) {
      console.error('Failed to add product to cart:', error)
    }
  }

  const bundleBonusPct = REWARDS_CONFIG.bundleBonus.bonusPct

  return (
    <div className='mt-4'>
      <div className='md:px-2 mb-2'>
        <h2 className='md:text-xl text-lg font-okxs font-semibold'>
          Recommended for you
        </h2>
        {hasOnlyOneCategory && (
          <p className='text-sm italic mt-0.5 space-x-1'>
            <span className=' opacity-80'>Add another category for</span>
            <span className='font-semibold opacity-100'>
              {bundleBonusPct}% bundle cash back
            </span>
          </p>
        )}
      </div>
      <div className='space-y-3'>
        {recommendedProducts.map((product) => (
          <RecommendedCard
            key={product._id}
            product={product}
            onAddToCart={handleAddToCart}
            getLowestPriceCents={getLowestDenominationPriceCents}
          />
        ))}
      </div>
    </div>
  )
})

type RecommendedCardProps = {
  product: ProductWithId
  onAddToCart: (product: ProductWithId) => void
  getLowestPriceCents: (p: StoreProduct) => number
}

const RecommendedCard = memo(function RecommendedCard({
  product,
  onAddToCart,
  getLowestPriceCents,
}: RecommendedCardProps) {
  const productImage = useQuery(api.products.q.getPrimaryImage, {
    id: product._id,
  })
  const lowestPriceCents = getLowestPriceCents(product)

  return (
    <Card
      className='rounded-xl bg-linear-to-l from-featured/15 via-light-gray/10 to-transparent dark:bg-dark-gray/15'
      shadow='none'>
      <CardBody className='p-0 md:p-6'>
        <div className='flex min-w-0 gap-4 items-center'>
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
            <h3 className='font-okxs font-semibold text-xl truncate'>
              {product.name}
            </h3>

            <div className='relative flex font-okxs items-center justify-between'>
              <p className='text-base font-medium mt-1'>
                <span className='opacity-80'>$</span>
                {formatPrice(lowestPriceCents)}
              </p>

              <Button
                size='sm'
                radius='none'
                variant='shadow'
                className='absolute bg-dark-table dark:bg-white/10 dark:backdrop-blur-xl rounded-lg dark:text-white/80 dark:hover:text-white border-b border-l border-white/10 -space-x-1.5 top-3.5 right-0 font-okxs font-medium shrink-0 flex text-white text-sm'
                onPress={() => onAddToCart(product)}>
                <span>Add</span>
                <span className='md:flex hidden'> to Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
})

RecommendedProducts.displayName = 'RecommendedProducts'
