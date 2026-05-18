import {describe, expect, test} from 'bun:test'
import {
  getMetaPixelId,
  trackMetaPixelAddToCart,
  trackMetaPixelCheckoutClick,
  trackMetaPixelInitiateCheckout,
  trackMetaPixelViewContent,
} from '@/lib/meta-pixel'

describe('meta pixel config parsing', () => {
  test('reads the canonical pixelId key', () => {
    expect(getMetaPixelId({pixelId: '1499203201936284'})).toBe(
      '1499203201936284',
    )
  })

  test('supports legacy metapixel keys', () => {
    expect(getMetaPixelId({metapixel: '1499203201936284'})).toBe(
      '1499203201936284',
    )
    expect(getMetaPixelId({metapixel_id: '1499203201936284'})).toBe(
      '1499203201936284',
    )
  })

  test('ignores missing and error-shaped settings', () => {
    expect(getMetaPixelId(undefined)).toBeNull()
    expect(
      getMetaPixelId({
        error: 'NOT_FOUND',
        message: 'metapixel_id',
        status: 404,
      }),
    ).toBeNull()
  })
})

describe('meta pixel commerce events', () => {
  test('tracks add to cart with normalized content ids', () => {
    const calls: unknown[][] = []
    globalThis.window = {
      fbq: (...args: unknown[]) => {
        calls.push(args)
      },
    } as Window & typeof globalThis

    trackMetaPixelAddToCart({
      contentIds: ['sku-1', 'sku-1', '  sku-2  '],
      quantity: 2,
    })

    expect(calls).toEqual([
      [
        'track',
        'AddToCart',
        {
          content_ids: ['sku-1', 'sku-2'],
          content_type: 'product',
          quantity: 2,
        },
      ],
    ])
  })

  test('tracks initiate checkout with value and item count', () => {
    const calls: unknown[][] = []
    globalThis.window = {
      fbq: (...args: unknown[]) => {
        calls.push(args)
      },
    } as Window & typeof globalThis

    trackMetaPixelInitiateCheckout({
      contentIds: ['sku-1', 'sku-2'],
      numItems: 3,
      value: 149.99,
    })

    expect(calls).toEqual([
      [
        'track',
        'InitiateCheckout',
        {
          content_ids: ['sku-1', 'sku-2'],
          content_type: 'product',
          currency: 'USD',
          num_items: 3,
          value: 149.99,
        },
      ],
    ])
  })

  test('tracks checkout click as a custom event', () => {
    const calls: unknown[][] = []
    globalThis.window = {
      fbq: (...args: unknown[]) => {
        calls.push(args)
      },
    } as Window & typeof globalThis

    trackMetaPixelCheckoutClick({
      location: 'cart_drawer',
      authenticated: false,
      numItems: 2,
      value: 89.5,
    })

    expect(calls).toEqual([
      [
        'trackCustom',
        'CheckoutClick',
        {
          authenticated: false,
          currency: 'USD',
          location: 'cart_drawer',
          num_items: 2,
          value: 89.5,
        },
      ],
    ])
  })

  test('tracks product page views as view content', () => {
    const calls: unknown[][] = []
    globalThis.window = {
      fbq: (...args: unknown[]) => {
        calls.push(args)
      },
    } as Window & typeof globalThis

    trackMetaPixelViewContent({
      contentId: 'product-123',
      contentName: 'Blue Dream',
      contentCategory: 'flower',
      value: 59.99,
    })

    expect(calls).toEqual([
      [
        'track',
        'ViewContent',
        {
          content_category: 'flower',
          content_ids: ['product-123'],
          content_name: 'Blue Dream',
          content_type: 'product',
          currency: 'USD',
          value: 59.99,
        },
      ],
    ])
  })
})
