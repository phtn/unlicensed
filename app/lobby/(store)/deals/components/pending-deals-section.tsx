'use client'

import type {CartPageItem} from '@/app/lobby/(store)/cart/types'
import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import type {PendingDeal} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {Id} from '@/convex/_generated/dataModel'
import {usePendingDeals} from '@/ctx/pending-deals'
import Link from 'next/link'

/** Cart "covers" a deal if for each deal item the cart has at least that quantity for that product+denomination. */
function cartCoversDeal(cartItems: CartPageItem[], deal: PendingDeal): boolean {
  const cartKey = (productId: Id<'products'>, denom: number) =>
    `${productId}-${denom}`
  const cartQty = new Map<string, number>()
  for (const item of cartItems) {
    const key = cartKey(item.product._id, item.denomination ?? 0)
    cartQty.set(key, (cartQty.get(key) ?? 0) + item.quantity)
  }
  for (const di of deal.items) {
    const key = cartKey(di.productId, di.denomination)
    const inCart = cartQty.get(key) ?? 0
    if (inCart < di.quantity) return false
  }
  return true
}

interface PendingDealsSectionProps {
  /** If provided, deals already represented in the cart are hidden (e.g. after adding a bundle). */
  cartItems?: CartPageItem[]
}

export function PendingDealsSection({
  cartItems = [],
}: PendingDealsSectionProps) {
  const {configs} = useDealConfigs()
  const pendingCtx = usePendingDeals()
  const visibleDeals = pendingCtx
    ? pendingCtx.pendingDeals.filter((deal) => {
        if (deal.totalSelected >= deal.requiredTotal) return false
        if (cartItems.length > 0 && cartCoversDeal(cartItems, deal))
          return false
        return true
      })
    : []

  if (visibleDeals.length === 0) return null

  return (
    <div className='rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 w-full'>
      <h3 className='font-semibold text-sm text-amber-700 dark:text-amber-400'>
        Incomplete deals
      </h3>
      <p className='mt-1 text-xs text-muted-foreground'>
        Finish building these bundles to add them to your cart.
      </p>
      <ul className='mt-3 space-y-2'>
        {visibleDeals.map((deal) => {
          const config = configs[deal.bundleType]
          const totalCents = deal.items.reduce(
            (s, i) => s + i.priceCents * i.quantity,
            0,
          )
          return (
            <li
              key={deal.bundleType}
              className='flex items-center justify-between gap-2 text-sm min-w-0'>
              <span className='min-w-0 truncate'>
                {config?.title ?? deal.bundleType} — {deal.totalSelected}/
                {deal.requiredTotal} selected (${(totalCents / 100).toFixed(2)})
              </span>
              <Link
                href='/lobby/deals'
                className='shrink-0 text-warning hover:text-warning/80'>
                Complete
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
