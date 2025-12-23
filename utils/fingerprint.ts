export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') ?? 'unknown'
}

/**
 * Extracts screen width from cookies
 * Screen dimensions are set by client-side ScreenDimensionsTracker component
 * @param request - The request object (NextRequest for cookies, or Request for headers)
 * @returns Screen width in pixels, or undefined if not available
 */
export function getScreenWidth(
  request: Request | {cookies: {get: (name: string) => {value: string} | undefined}},
): number | undefined {
  // Try to get from cookies (NextRequest)
  if ('cookies' in request && request.cookies) {
    const screenWidth = request.cookies.get('x-screen-width')?.value
    if (screenWidth) {
      const parsed = Number.parseInt(screenWidth, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  // Fallback: try to get from headers (for compatibility)
  if ('headers' in request) {
    const screenWidth = request.headers.get('x-screen-width')
    if (screenWidth) {
      const parsed = Number.parseInt(screenWidth, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  return undefined
}

/**
 * Extracts screen height from cookies
 * Screen dimensions are set by client-side ScreenDimensionsTracker component
 * @param request - The request object (NextRequest for cookies, or Request for headers)
 * @returns Screen height in pixels, or undefined if not available
 */
export function getScreenHeight(
  request: Request | {cookies: {get: (name: string) => {value: string} | undefined}},
): number | undefined {
  // Try to get from cookies (NextRequest)
  if ('cookies' in request && request.cookies) {
    const screenHeight = request.cookies.get('x-screen-height')?.value
    if (screenHeight) {
      const parsed = Number.parseInt(screenHeight, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  // Fallback: try to get from headers (for compatibility)
  if ('headers' in request) {
    const screenHeight = request.headers.get('x-screen-height')
    if (screenHeight) {
      const parsed = Number.parseInt(screenHeight, 10)
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  return undefined
}
