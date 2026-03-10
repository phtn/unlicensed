import {beforeAll, describe, expect, mock, test} from 'bun:test'
import {useEffect} from 'react'
import {render, screen, waitFor} from './test-utils'
import {PendingDealsProvider, usePendingDeals} from '@/ctx/pending-deals'
import type {BundleConfig, BundleType} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {Id} from '@/convex/_generated/dataModel'

const dealConfigs: Record<string, BundleConfig> = {
  'build-your-own-oz': {
    id: 'build-your-own-oz',
    title: 'Build Your Own Oz',
    description: 'Build your own ounce',
    categorySlugs: ['flower'],
    variations: [
      {
        totalUnits: 8,
        denominationPerUnit: 0.125,
        unitLabel: 'oz',
      },
    ],
    maxPerStrain: 2,
  },
}

mock.module('@/app/lobby/(store)/deals/hooks/use-deal-configs', () => ({
  useDealConfigs: () => ({
    configs: dealConfigs,
    configsList: Object.values(dealConfigs),
    isLoading: false,
  }),
}))

type PendingDealsSectionComponent =
  typeof import('@/app/lobby/(store)/deals/components/pending-deals-section').PendingDealsSection

let PendingDealsSection: PendingDealsSectionComponent

beforeAll(async () => {
  ;({PendingDealsSection} = await import(
    '@/app/lobby/(store)/deals/components/pending-deals-section'
  ))
})

function DealsInjector({
  bundleType,
  items,
  requiredTotal,
}: {
  bundleType: BundleType
  items: Array<{
    productId: Id<'products'>
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
        productId: 'prod_test' as Id<'products'>,
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
