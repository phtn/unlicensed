/**
 * PayGate White-Label Proxy Server
 *
 * Self-hosted alternative to Cloudflare Workers for PayGate white-labeling.
 * Run this on your dedicated web server to proxy PayGate API requests.
 *
 * Usage:
 *   bun run server/paygate-proxy/index.ts
 *   or
 *   node --loader tsx server/paygate-proxy/index.ts
 *
 * Environment Variables:
 *   PORT=3001 (default)
 *   PAYGATE_USDC_WALLET=0x... (your USDC Polygon wallet)
 *   PAYGATE_AFFILIATE_WALLET=0x... (optional, for affiliate commissions)
 *   CUSTOM_CHECKOUT_DOMAIN=checkout.yourdomain.com (optional)
 */

import {serve} from 'bun'

// Configuration from environment variables
const PORT = parseInt(process.env.PORT || '3001', 10)
const USDC_WALLET = process.env.PAYGATE_USDC_WALLET || ''
const AFFILIATE_WALLET = process.env.PAYGATE_AFFILIATE_WALLET || ''
const CUSTOM_CHECKOUT_DOMAIN = process.env.CUSTOM_CHECKOUT_DOMAIN || ''

// PayGate API base URLs (DO NOT CHANGE)
const PAYGATE_API_URL = 'https://api.paygate.to'
// const PAYGATE_CHECKOUT_URL = 'https://checkout.paygate.to'

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const searchParams = url.searchParams

  // Add wallet parameter if configured and not already present
  if (USDC_WALLET && !searchParams.has('wallet')) {
    searchParams.set('wallet', USDC_WALLET)
  }

  // Add affiliate parameter if configured and not already present
  if (AFFILIATE_WALLET && !searchParams.has('affiliate')) {
    searchParams.set('affiliate', AFFILIATE_WALLET)
  }

  // Determine target endpoint
  let targetUrl: string

  if (path.startsWith('/crypto/')) {
    // Crypto payment endpoints
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  } else if (path.startsWith('/create.php') || path === '/create.php') {
    // Credit card payment creation
    targetUrl = `${PAYGATE_API_URL}/create.php?${searchParams.toString()}`
  } else if (path.startsWith('/status.php') || path === '/status.php') {
    // Payment status check
    targetUrl = `${PAYGATE_API_URL}/status.php?${searchParams.toString()}`
  } else if (path.startsWith('/info.php') || path === '/info.php') {
    // General info endpoints
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  } else {
    // Default: proxy to PayGate API
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  }

  try {
    // Create request headers (preserve original headers but remove host)
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.set('User-Agent', 'PayGate-Proxy/1.0')

    // Fetch from PayGate API
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method !== 'GET' && request.method !== 'HEAD'
          ? request.body
          : undefined,
    })

    // Get response text
    let responseText = await response.text()

    // Replace checkout domain in response if custom domain is configured
    if (
      CUSTOM_CHECKOUT_DOMAIN &&
      responseText.includes('checkout.paygate.to')
    ) {
      responseText = responseText.replace(
        /checkout\.paygate\.to/g,
        CUSTOM_CHECKOUT_DOMAIN,
      )
    }

    // Return response with CORS headers
    return new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
}

// Handle OPTIONS requests for CORS preflight
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

// Start server
console.log(`𝐏 Proxy Server starting on port ${PORT}`)
console.log(`𝐖 USDC Wallet: ${USDC_WALLET || 'Not configured'}`)
console.log(`𝐀 Affiliate Wallet: ${AFFILIATE_WALLET || 'Not configured'}`)
console.log(
  `𝐃 Custom Checkout Domain: ${CUSTOM_CHECKOUT_DOMAIN || 'Not configured'}`,
)

serve({
  port: PORT,
  fetch: async (request: Request) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    return handleRequest(request)
  },
})

console.log(`✅ PayGate Proxy Server running at http://localhost:${PORT}`)
console.log(`📡 Ready to proxy requests to PayGate API`)
