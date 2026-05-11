import {beforeAll, beforeEach, describe, expect, mock, test} from 'bun:test'
import {act, render, screen} from './test-utils'
import type {Id} from '@/convex/_generated/dataModel'
import {CART_PRODUCT_QUANTITIES_UPDATED_EVENT} from '@/lib/cart-product-quantities'

const mockUseQuery = mock(() => 2)
const mockUseAuthCtx = mock(() => ({
  user: {uid: 'firebase-user'},
  convexUserId: 'user-1' as Id<'users'>,
  isConvexUserLoading: false,
}))

mock.module('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

mock.module('@/ctx/auth', () => ({
  useAuthCtx: () => mockUseAuthCtx(),
}))

type UseProductCartQuantityHook =
  typeof import('@/hooks/use-product-cart-quantity').useProductCartQuantity

let useProductCartQuantity: UseProductCartQuantityHook

beforeAll(async () => {
  ;({useProductCartQuantity} = await import('@/hooks/use-product-cart-quantity'))
})

beforeEach(() => {
  mockUseQuery.mockImplementation(() => 2)
  mockUseAuthCtx.mockImplementation(() => ({
    user: {uid: 'firebase-user'},
    convexUserId: 'user-1' as Id<'users'>,
    isConvexUserLoading: false,
  }))
})

function QuantityProbe({productId}: {productId: Id<'products'>}) {
  const quantity = useProductCartQuantity(productId)
  return <div data-testid='quantity'>{quantity}</div>
}

describe('useProductCartQuantity', () => {
  test('updates immediately when authenticated cart quantity events are emitted', () => {
    const productId = 'product-1' as Id<'products'>

    render(<QuantityProbe productId={productId} />)

    expect(screen.getByTestId('quantity')).toHaveTextContent('2')

    act(() => {
      window.dispatchEvent(
        new CustomEvent(CART_PRODUCT_QUANTITIES_UPDATED_EVENT, {
          detail: {
            updates: [{productId, quantity: 0}],
          },
        }),
      )
    })

    expect(screen.getByTestId('quantity')).toHaveTextContent('0')
  })
})
