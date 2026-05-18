import 'server-only'

import {createHmac} from 'node:crypto'

const HASH_LABEL = 'ip-network:'
const HASH_PATTERN = /^[a-f0-9]{64}$/i

const resolvedIpNetworkByHash = new Map<string, string | null>()
const pendingIpNetworkLookups = new Map<string, Promise<string | null>>()

function getGuestTrackingHashSalt() {
  const salt = process.env.GUEST_TRACKING_HASH_SALT?.trim()
  return salt || null
}

function normalizeHash(hash: string | null | undefined) {
  const normalized = hash?.trim().toLowerCase()
  return normalized && HASH_PATTERN.test(normalized) ? normalized : null
}

function hashIpNetwork(salt: string, ipNetwork: string) {
  return createHmac('sha256', salt)
    .update(`${HASH_LABEL}${ipNetwork}`)
    .digest('hex')
}

async function resolveIpv4NetworkHash(targetHash: string) {
  const salt = getGuestTrackingHashSalt()
  if (!salt) {
    return null
  }

  for (let a = 0; a <= 255; a += 1) {
    for (let b = 0; b <= 255; b += 1) {
      for (let c = 0; c <= 255; c += 1) {
        const candidate = `${a}.${b}.${c}.0`
        if (hashIpNetwork(salt, candidate) === targetHash) {
          return candidate
        }
      }
    }
  }

  return null
}

export async function decipherGuestTrackingIpNetworkHash(
  hash: string | null | undefined,
) {
  const salt = getGuestTrackingHashSalt()
  if (!salt) {
    return null
  }

  const normalizedHash = normalizeHash(hash)
  if (!normalizedHash) {
    return null
  }

  const cacheKey = `${salt}:${normalizedHash}`

  if (resolvedIpNetworkByHash.has(cacheKey)) {
    return resolvedIpNetworkByHash.get(cacheKey) ?? null
  }

  const pendingLookup = pendingIpNetworkLookups.get(cacheKey)
  if (pendingLookup) {
    return pendingLookup
  }

  const lookup = resolveIpv4NetworkHash(normalizedHash).finally(() => {
    pendingIpNetworkLookups.delete(cacheKey)
  })

  pendingIpNetworkLookups.set(cacheKey, lookup)

  const resolved = await lookup
  resolvedIpNetworkByHash.set(cacheKey, resolved)
  return resolved
}
