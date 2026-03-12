import { describe, expect, test } from 'bun:test'
import { createRateLimiter } from '../lib/resend/rate-limit'

describe('resend rate limit', () => {
  test('spaces queued sends to the configured interval', async () => {
    let now = 0
    const sleeps: number[] = []
    const startedAt: number[] = []

    const limit = createRateLimiter({
      minIntervalMs: 20,
      now: () => now,
      sleep: async (ms) => {
        sleeps.push(ms)
        now += ms
      },
    })

    await Promise.all([
      limit(async () => {
        startedAt.push(now)
        return 'first'
      }),
      limit(async () => {
        startedAt.push(now)
        return 'second'
      }),
      limit(async () => {
        startedAt.push(now)
        return 'third'
      }),
    ])

    expect(startedAt).toEqual([0, 20, 40])
    expect(sleeps).toEqual([20, 20])
  })
})
