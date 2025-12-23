/**
 * Parse user agent string to extract device, browser, and OS information
 */

export interface ParsedUserAgent {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase()
  const result: ParsedUserAgent = {
    deviceType: 'unknown',
  }

  // Detect device type
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
    result.deviceType = 'tablet'
  } else if (
    /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    )
  ) {
    result.deviceType = 'mobile'
  } else {
    result.deviceType = 'desktop'
  }

  // Detect browser
  if (ua.includes('edg/')) {
    result.browser = 'Edge'
    const match = userAgent.match(/edg\/([\d.]+)/i)
    if (match) result.browserVersion = match[1]
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    result.browser = 'Chrome'
    const match = userAgent.match(/chrome\/([\d.]+)/i)
    if (match) result.browserVersion = match[1]
  } else if (ua.includes('firefox/')) {
    result.browser = 'Firefox'
    const match = userAgent.match(/firefox\/([\d.]+)/i)
    if (match) result.browserVersion = match[1]
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    result.browser = 'Safari'
    const match = userAgent.match(/version\/([\d.]+).*safari/i)
    if (match) result.browserVersion = match[1]
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    result.browser = 'Opera'
    const match = userAgent.match(/(?:opera|opr)\/([\d.]+)/i)
    if (match) result.browserVersion = match[1]
  }

  // Detect OS
  if (ua.includes('windows nt')) {
    result.os = 'Windows'
    const match = userAgent.match(/windows nt ([\d.]+)/i)
    if (match) {
      const version = match[1]
      if (version === '10.0') result.osVersion = '10/11'
      else if (version === '6.3') result.osVersion = '8.1'
      else if (version === '6.2') result.osVersion = '8'
      else if (version === '6.1') result.osVersion = '7'
      else result.osVersion = version
    }
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    result.os = 'macOS'
    const match = userAgent.match(/mac os x ([\d_]+)/i)
    if (match) result.osVersion = match[1].replace(/_/g, '.')
  } else if (ua.includes('linux')) {
    result.os = 'Linux'
  } else if (ua.includes('android')) {
    result.os = 'Android'
    const match = userAgent.match(/android ([\d.]+)/i)
    if (match) result.osVersion = match[1]
  } else if (ua.includes('iphone os') || ua.includes('ipad')) {
    result.os = 'iOS'
    const match = userAgent.match(/os ([\d_]+)/i)
    if (match) result.osVersion = match[1].replace(/_/g, '.')
  }

  return result
}

