const pascalCaseBrands = {
  plugplay: 'PlugPlay',
  coldfire: 'ColdFire',
} as const

export const formatBrandLabel = (brand: string) => {
  const trimmedBrand = brand.trim()
  if (!trimmedBrand) return ''

  const normalizedBrandKey = trimmedBrand
    .replace(/[\s_-]+/g, '')
    .toLowerCase()
  const pascalCaseBrand =
    pascalCaseBrands[normalizedBrandKey as keyof typeof pascalCaseBrands]

  if (pascalCaseBrand) {
    return pascalCaseBrand
  }

  return trimmedBrand
    .split(/[-_]+/)
    .map((segment) =>
      segment.length > 0
        ? `${segment[0].toUpperCase()}${segment.slice(1)}`
        : segment,
    )
    .join(' ')
}
