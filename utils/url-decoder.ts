/**
 * Decode address if it's already URL-encoded
 * URLSearchParams will encode it automatically, so we need the raw value
 */
export function decodeAddressIfNeeded(address: string): string {
  try {
    const decoded = decodeURIComponent(address)
    // If decoding produces a different value, it was encoded - use decoded version
    if (decoded !== address) {
      return decoded
    }
    // If it's the same, it wasn't encoded - use as-is (URLSearchParams will encode it)
    return address
  } catch {
    // If decode fails, use as-is
    return address
  }
}
