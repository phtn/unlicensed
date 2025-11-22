export const formatPrice = (priceCents: number, decimals = 2) => {
  const dollars = priceCents / 100
  return `${dollars.toFixed(decimals)}`
}
