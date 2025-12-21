/**
 * PayGate White-Label Cloudflare Worker (Affiliate Version)
 *
 * This version automatically adds your affiliate wallet to earn 0.5% commission
 * on all transactions processed through your custom domain.
 *
 * Setup Instructions:
 * 1. Replace YOUR_USDC_WALLET_ADDRESS_HERE with your actual USDC Polygon wallet
 * 2. Replace YOUR_AFFILIATE_WALLET_ADDRESS_HERE with your affiliate wallet (can be same as USDC_WALLET)
 * 3. Deploy to Cloudflare Workers
 * 4. Route your custom domains to this worker
 */

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

// Your USDC Polygon wallet address for receiving payments
// IMPORTANT: Replace this with your actual wallet address
const USDC_WALLET = '0xda74a12A42E88BA7c9cCAeB1519a10F3423d4c85'

// Your affiliate wallet address (for earning commission)
// Can be the same as USDC_WALLET or a different wallet
// IMPORTANT: Replace this with your actual affiliate wallet address
const AFFILIATE_WALLET = 'YOUR_AFFILIATE_WALLET_ADDRESS_HERE'

// PayGate API base URL (DO NOT CHANGE)
const PAYGATE_API_URL = 'https://api.paygate.to'

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  const searchParams = url.searchParams

  // Add wallet parameter
  if (
    USDC_WALLET &&
    USDC_WALLET !== '0xda74a12A42E88BA7c9cCAeB1519a10F3423d4c85' &&
    !searchParams.has('wallet')
  ) {
    searchParams.set('wallet', USDC_WALLET)
  }

  // Add affiliate parameter for commission (0.5% default)
  if (
    AFFILIATE_WALLET &&
    AFFILIATE_WALLET !== 'YOUR_AFFILIATE_WALLET_ADDRESS_HERE' &&
    !searchParams.has('affiliate')
  ) {
    searchParams.set('affiliate', AFFILIATE_WALLET)
  }

  // Determine target endpoint
  let targetUrl

  if (path.startsWith('/crypto/')) {
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  } else if (path.startsWith('/create.php') || path === '/create.php') {
    targetUrl = `${PAYGATE_API_URL}/create.php?${searchParams.toString()}`
  } else if (path.startsWith('/status.php') || path === '/status.php') {
    targetUrl = `${PAYGATE_API_URL}/status.php?${searchParams.toString()}`
  } else {
    targetUrl = `${PAYGATE_API_URL}${path}?${searchParams.toString()}`
  }

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })

  const response = await fetch(modifiedRequest)

  return new Response(await response.text(), {
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
