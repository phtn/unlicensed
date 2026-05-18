import {afterEach, describe, expect, mock, test} from 'bun:test'
import {createHmac} from 'node:crypto'

mock.module('server-only', () => ({}))

const {decipherGuestTrackingIpNetworkHash} = await import(
  '@/lib/guest-tracking/ip-network-hash'
)

const originalHashSalt = process.env.GUEST_TRACKING_HASH_SALT

afterEach(() => {
  if (originalHashSalt === undefined) {
    delete process.env.GUEST_TRACKING_HASH_SALT
  } else {
    process.env.GUEST_TRACKING_HASH_SALT = originalHashSalt
  }
})

describe('guest tracking IP network hash decipher', () => {
  test('resolves a hashed IPv4 network', async () => {
    process.env.GUEST_TRACKING_HASH_SALT = 'test-hash-salt'

    const hash = createHmac('sha256', process.env.GUEST_TRACKING_HASH_SALT)
      .update('ip-network:0.0.2.0')
      .digest('hex')

    await expect(decipherGuestTrackingIpNetworkHash(hash)).resolves.toBe(
      '0.0.2.0',
    )
  })

  test('returns null for invalid hashes', async () => {
    process.env.GUEST_TRACKING_HASH_SALT = 'test-hash-salt'

    await expect(decipherGuestTrackingIpNetworkHash('invalid')).resolves.toBe(
      null,
    )
  })

  test('returns null without a configured salt', async () => {
    delete process.env.GUEST_TRACKING_HASH_SALT

    const hash = createHmac('sha256', 'test-hash-salt')
      .update('ip-network:0.0.2.0')
      .digest('hex')

    await expect(decipherGuestTrackingIpNetworkHash(hash)).resolves.toBe(null)
  })
})
