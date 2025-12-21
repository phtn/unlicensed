/**
 * PayGate White-Label Cloudflare Worker
 *
 * This worker proxies requests to PayGate API while using your custom domain.
 * Optionally injects affiliate wallet for commission tracking.
 *
 * Setup Instructions:
 * 1. Replace YOUR_USDC_WALLET_ADDRESS_HERE with your actual USDC Polygon wallet
 * 2. Optionally set CUSTOM_CHECKOUT_DOMAIN if you want to replace checkout domain in responses
 * 3. Deploy to Cloudflare Workers
 * 4. Route your custom domains (api.yourdomain.com, checkout.yourdomain.com) to this worker
 */

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

// Your USDC Polygon wallet address for receiving payments
// IMPORTANT: Replace this with your actual wallet address
const USDC_WALLET = '0xda74a12A42E88BA7c9cCAeB1519a10F3423d4c85'

// Optional: Custom checkout domain for display (leave as is if not using)
// This will replace checkout.paygate.to in API responses
const CUSTOM_CHECKOUT_DOMAIN = 'checkout.example.com'

// PayGate API base URL (DO NOT CHANGE)
const PAYGATE_API_URL = 'https://api.paygate.to'
const PAYGATE_CHECKOUT_URL = 'https://checkout.paygate.to'

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  const searchParams = url.searchParams

  // Add wallet parameter if not present and wallet is configured
  if (
    USDC_WALLET &&
    USDC_WALLET !== '0xda74a12A42E88BA7c9cCAeB1519a10F3423d4c85' &&
    !searchParams.has('wallet')
  ) {
    searchParams.set('wallet', USDC_WALLET)
  }

  // Determine target endpoint
  let targetUrl

  if (path.startsWith('/crypto/')) {
    // Crypto payment endpoints
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  } else if (path.startsWith('/create.php') || path === '/create.php') {
    // Credit card payment creation
    targetUrl = `${PAYGATE_API_URL}/create.php?${searchParams.toString()}`
  } else if (path.startsWith('/status.php') || path === '/status.php') {
    // Payment status check
    targetUrl = `${PAYGATE_API_URL}/status.php?${searchParams.toString()}`
  } else {
    // Default: proxy to PayGate API
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  }

  // Create new request
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })

  // Fetch from PayGate
  const response = await fetch(modifiedRequest)

  // Clone response to modify if needed
  const clonedResponse = response.clone()
  const responseText = await clonedResponse.text()

  // If response contains checkout URL, optionally replace domain
  let modifiedResponseText = responseText
  if (
    CUSTOM_CHECKOUT_DOMAIN &&
    CUSTOM_CHECKOUT_DOMAIN !== 'checkout.example.com' &&
    responseText.includes('checkout.paygate.to')
  ) {
    modifiedResponseText = responseText.replace(
      /checkout\.paygate\.to/g,
      CUSTOM_CHECKOUT_DOMAIN,
    )
  }

  // Return response with CORS headers
  return new Response(modifiedResponseText, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
