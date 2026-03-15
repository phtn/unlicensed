import {
  convertFiatAmount,
  getFiatRateMap,
} from '@/app/admin/(routes)/payments/_components/fiat-conversion'
import {describe, expect, test} from 'bun:test'

describe('fiat conversion helpers', () => {
  test('converts correctly after swapping USD and EUR', () => {
    const rateMap = getFiatRateMap({
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      fromRate: '1',
      toRate: '1.08',
    })

    expect(
      convertFiatAmount({
        amount: '1.08',
        from: 'USD',
        to: 'EUR',
        rateMap,
      }),
    ).toBe('1')
  })

  test('converts correctly in both directions for the selected currencies', () => {
    const rateMap = getFiatRateMap({
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      fromRate: '1.08',
      toRate: '1',
    })

    expect(
      convertFiatAmount({
        amount: '1',
        from: 'EUR',
        to: 'USD',
        rateMap,
      }),
    ).toBe('1.08')

    expect(
      convertFiatAmount({
        amount: '1.08',
        from: 'USD',
        to: 'EUR',
        rateMap,
      }),
    ).toBe('1')
  })
})
