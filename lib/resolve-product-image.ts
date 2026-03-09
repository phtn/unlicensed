export const resolveProductImage = (
  image: string | null | undefined,
  resolveUrl: (value: string) => string | null,
): string | undefined => {
  if (!image) {
    return undefined
  }

  if (image.startsWith('http')) {
    return image
  }

  const resolvedUrl = resolveUrl(image)
  return resolvedUrl?.startsWith('http') ? resolvedUrl : undefined
}
