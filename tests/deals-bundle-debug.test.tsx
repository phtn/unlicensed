import {DealsBundleDebug} from '@/app/lobby/(store)/deals/components/deals-bundle-debug'
import {DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {describe, expect, test} from 'bun:test'
import {render, screen} from './test-utils'

function mkProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    _id: 'prod_1' as Id<'products'>,
    name: 'Test Flower',
    slug: 'test-flower',
    categorySlug: 'flower',
    shortDescription: 'Test flower short description',
    description: 'Test flower description',
    priceCents: 2599,
    unit: 'g',
    availableDenominations: [0.125, 0.25, 3.5, 7],
    popularDenomination: [3.5],
    thcPercentage: 20,
    effects: ['relaxed'],
    terpenes: ['myrcene'],
    featured: false,
    limited: false,
    onSale: false,
    available: true,
    stock: 10,
    rating: 4.5,
    image: null,
    gallery: [],
    consumption: 'Smoke',
    flavorNotes: ['earthy'],
    potencyLevel: 'medium',
    ...overrides,
  }
}

describe('DealsBundleDebug', () => {
  const config = DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG
  const variation = config.variations[0]
  const products: StoreProduct[] = [
    mkProduct({_id: 'p1' as Id<'products'>}),
    mkProduct({_id: 'p2' as Id<'products'>, name: 'Other Strain'}),
  ]
  const productIds = products.map((p) => p._id) as Id<'products'>[]
  const pairs = productIds.map((productId) => ({
    productId,
    denomination: variation.denominationPerUnit,
  }))
  const availableMap: Record<string, number> = {
    'p1-0.125': 10,
    'p2-0.125': 5,
  }
  const filteredProducts = products

  test('renders collapsible details', () => {
    render(
      <DealsBundleDebug
        bundleId='build-your-own-oz'
        config={config}
        variation={variation}
        products={products}
        productIds={productIds}
        pairs={pairs}
        availableMap={availableMap}
        filteredProducts={filteredProducts}
      />,
    )
    expect(
      screen.getByText(/\[Debug\] Build Your Own Oz — why 2 products shown/i),
    ).toBeInTheDocument()
  })

  test('shows pipeline counts when expanded', () => {
    render(
      <DealsBundleDebug
        bundleId='build-your-own-oz'
        config={config}
        variation={variation}
        products={products}
        productIds={productIds}
        pairs={pairs}
        availableMap={availableMap}
        filteredProducts={filteredProducts}
      />,
    )
    const summary = screen.getByText(/\[Debug\] Build Your Own Oz/)
    summary.click()
    expect(screen.getByRole('cell', {name: /^products$/})).toBeInTheDocument()
    expect(screen.getByRole('cell', {name: /^productIds$/})).toBeInTheDocument()
    expect(
      screen.getByRole('cell', {name: /^filteredProducts$/}),
    ).toBeInTheDocument()
  })

  test('shows per-product filter reasons when expanded', () => {
    const productNoDenomId = 'p3' as Id<'products'>
    const productNoDenom = mkProduct({
      _id: productNoDenomId,
      name: 'No Denom',
      availableDenominations: [],
    })
    render(
      <DealsBundleDebug
        bundleId='build-your-own-oz'
        config={config}
        variation={variation}
        products={[productNoDenom, ...products]}
        productIds={[productNoDenomId, ...productIds]}
        pairs={pairs}
        availableMap={availableMap}
        filteredProducts={filteredProducts}
      />,
    )
    const summary = screen.getByText(/\[Debug\] Build Your Own Oz/)
    summary.click()
    expect(screen.getByText(/No Denom/)).toBeInTheDocument()
  })
})
