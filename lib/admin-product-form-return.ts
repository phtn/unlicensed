const ADMIN_PRODUCT_FORM_RETURN_COOKIE = 'hyfe_admin_product_return'
const ADMIN_PRODUCT_FORM_RETURN_MAX_AGE = 20 * 60

const normalizeAdminReturnPath = (value: string) => {
  const normalized = value.trim()

  if (!normalized.startsWith('/admin')) {
    return null
  }

  return normalized
}

const getCookieAttributes = (maxAge: number) => {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : ''

  return `path=/; max-age=${maxAge}; SameSite=Lax${secure}`
}

export const setAdminProductFormReturnPath = (value: string) => {
  if (typeof document === 'undefined') {
    return
  }

  const normalizedValue = normalizeAdminReturnPath(value)
  if (!normalizedValue) {
    return
  }

  document.cookie = `${ADMIN_PRODUCT_FORM_RETURN_COOKIE}=${encodeURIComponent(normalizedValue)}; ${getCookieAttributes(ADMIN_PRODUCT_FORM_RETURN_MAX_AGE)}`
}

export const getAdminProductFormReturnPath = () => {
  if (typeof document === 'undefined') {
    return null
  }

  const cookieEntry = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) =>
      value.startsWith(`${ADMIN_PRODUCT_FORM_RETURN_COOKIE}=`),
    )

  if (!cookieEntry) {
    return null
  }

  const [, rawValue = ''] = cookieEntry.split('=')

  try {
    return normalizeAdminReturnPath(decodeURIComponent(rawValue))
  } catch {
    return normalizeAdminReturnPath(rawValue)
  }
}

export const clearAdminProductFormReturnPath = () => {
  if (typeof document === 'undefined') {
    return
  }

  document.cookie = `${ADMIN_PRODUCT_FORM_RETURN_COOKIE}=; ${getCookieAttributes(0)}`
}

export const takeAdminProductFormReturnPath = (fallbackPath: string) => {
  const savedPath = getAdminProductFormReturnPath()

  clearAdminProductFormReturnPath()

  return savedPath ?? fallbackPath
}
