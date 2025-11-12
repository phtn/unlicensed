export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const ensureSlug = (value: string, fallbackSource: string): string => {
  const slug = value || fallbackSource
  return slugify(slug)
}

