addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Define the target URL to cloak
  const targetUrl = 'https://api.paygate.to'
  const allowedHostname = new URL(targetUrl).hostname

  // Parse and validate the request URL
  let url
  try {
    url = new URL(request.url)
  } catch (error) {
    return new Response('Invalid URL', { status: 400 })
  }

  // Validate pathname - only allow alphanumeric, forward slashes, dots, hyphens, underscores
  // This prevents path traversal attacks and other malicious paths
  const safePathPattern = /^[a-zA-Z0-9/._-]+$/
  if (!safePathPattern.test(url.pathname)) {
    return new Response('Invalid path', { status: 400 })
  }

  // Construct a safe target URL with validated components
  const targetUrlObj = new URL(targetUrl)
  targetUrlObj.pathname = url.pathname

  // Check if the path contains "wallet.php" and replace it with "affiliate.php"
  if (targetUrlObj.pathname.includes('/control/wallet.php')) {
    targetUrlObj.pathname = targetUrlObj.pathname.replace(
      '/control/wallet.php',
      '/subsevmer/fivepercent.php',
    )
  }

  // Sanitize and preserve existing search params (only allow safe characters)
  const safeSearchParams = new URLSearchParams()
  for (const [key, value] of url.searchParams) {
    // Validate key and value contain only safe characters
    if (/^[a-zA-Z0-9._-]+$/.test(key) && /^[a-zA-Z0-9._-@=&]+$/.test(value)) {
      safeSearchParams.append(key, value)
    }
  }

  // Add the affiliate parameter to the URL
  safeSearchParams.set('affiliate', '0x72C378b08A43b7965EB8A8ec8E662eE41C87e5e2')
  safeSearchParams.set('domain', 'checkout.rapidfirenow.com')

  targetUrlObj.search = safeSearchParams.toString()

  // Final validation: ensure the URL points to the allowed hostname
  if (targetUrlObj.hostname !== allowedHostname) {
    return new Response('Invalid target hostname', { status: 403 })
  }

  // Create a modified request with the validated URL
  const modifiedRequest = new Request(targetUrlObj.toString(), request)

  // Make a request to the target URL
  const response = await fetch(modifiedRequest)

  // If the response status code is in the 40X range, redirect to custom error page https://www.example.com/error
  if (response.status >= 400 && response.status < 500) {
    return Response.redirect('https://rapidfirenow.com/error', 302)
  }

  // Clone the response to modify headers
  const modifiedResponse = new Response(response.body, response)

  // Set headers to cloak the origin
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')

  return modifiedResponse
}
