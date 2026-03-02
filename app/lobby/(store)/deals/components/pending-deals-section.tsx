'use client'

import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import {usePendingDeals} from '@/ctx/pending-deals'
import {Button} from '@heroui/react'
import Link from 'next/link'

export function PendingDealsSection() {
  const {configs} = useDealConfigs()
  const pendingCtx = usePendingDeals()
  if (!pendingCtx) return null

  const {pendingDeals} = pendingCtx
  if (pendingDeals.length === 0) return null

  return (
    <div className='rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 w-full'>
      <h3 className='font-semibold text-sm text-amber-700 dark:text-amber-400'>
        Incomplete deals
      </h3>
      <p className='mt-1 text-xs text-muted-foreground'>
        Finish building these bundles to add them to your cart.
      </p>
      <ul className='mt-3 space-y-2'>
        {pendingDeals.map((deal) => {
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
                {config?.title ?? deal.bundleType} — {deal.totalSelected}/{deal.requiredTotal}{' '}
                selected (${(totalCents / 100).toFixed(2)})
              </span>
              <Button
                className='shrink-0'
                as={Link}
                href='/lobby/deals'
                size='sm'
                variant='flat'
                color='warning'>
                Complete
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
