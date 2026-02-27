export const formatPrice = (priceCents: number, decimals = 2) => {
  const dollars = priceCents / 100
  const format = {
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }
  return `${dollars.toLocaleString('en-US', format)}`
}

export const parseHexToInt = (hexString?: string): number => {
  if (!hexString) return 0
  const asBigInt = BigInt(hexString)
  const asNumber = Number(asBigInt)
  return asNumber
}

// // ✅ Recommended — safe for large numbers
// const asBigInt = BigInt(value); // 712931800000000n

// // Convert to number only if you're sure it fits (< Number.MAX_SAFE_INTEGER)
// const asNumber = Number(asBigInt); // 712931800000000

// // ⚠️ Alternative — loses precision for very large hex values
// const withParseInt = parseInt(value, 16); // 712931800000000
