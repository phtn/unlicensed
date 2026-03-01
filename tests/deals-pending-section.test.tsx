import {describe, expect, test} from 'bun:test'
import {useEffect} from 'react'
import {render, screen, waitFor} from './test-utils'
import {PendingDealsSection} from '@/app/lobby/(store)/deals/components/pending-deals-section'
import {PendingDealsProvider, usePendingDeals} from '@/ctx/pending-deals'
import type {BundleType} from '@/app/lobby/(store)/deals/lib/deal-types'

function DealsInjector({
  bundleType,
  items,
  requiredTotal,
}: {
  bundleType: BundleType
  items: Array<{
    productId: string
    productName: string
    quantity: number
    denomination: number
    priceCents: number
  }>
  requiredTotal: number
}) {
  const {setPendingDeal} = usePendingDeals()!
  useEffect(() => {
    setPendingDeal(bundleType, items, requiredTotal)
  }, [bundleType, items, requiredTotal, setPendingDeal])
  return null
}

describe('PendingDealsSection', () => {
  test('renders nothing when outside PendingDealsProvider', () => {
    render(<PendingDealsSection />)
    expect(screen.queryByText(/Incomplete deals/i)).not.toBeInTheDocument()
  })

  test('renders nothing when pendingDeals is empty', () => {
    render(
      <PendingDealsProvider>
        <PendingDealsSection />
      </PendingDealsProvider>,
    )
    expect(screen.queryByText(/Incomplete deals/i)).not.toBeInTheDocument()
  })

  test('renders section when pending deals exist', async () => {
    const items = [
      {
        productId: 'prod_test' as const,
        productName: 'Test Product',
        quantity: 2,
        denomination: 3.5,
        priceCents: 2599,
      },
    ]
    render(
      <PendingDealsProvider>
        <DealsInjector
          bundleType='build-your-own-oz'
          items={items}
          requiredTotal={8}
        />
        <PendingDealsSection />
      </PendingDealsProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText(/Incomplete deals/i)).toBeInTheDocument()
    })
    expect(
      screen.getByText(/Build Your Own Oz — 2\/8 selected/i),
    ).toBeInTheDocument()
    const completeBtn = screen.getByRole('button', {name: /Complete/i})
    expect(completeBtn).toHaveAttribute('href', '/lobby/deals')
  })
})
