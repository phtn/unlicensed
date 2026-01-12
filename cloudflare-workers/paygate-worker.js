// /**
//  * paygate white-label cloudflare worker
//  *
//  * this worker proxies requests to paygate api while using your custom domain.
//  * optionally injects affiliate wallet for commission tracking.
//  *
//  * setup instructions:
//  * 1. replace your_usdc_wallet_address_here with your actual usdc polygon wallet
//  * 2. optionally set custom_checkout_domain if you want to replace checkout domain in responses
//  * 3. deploy to cloudflare workers
//  * 4. route your custom domains (api.yourdomain.com, checkout.yourdomain.com) to this worker
//  */

// addeventlistener('fetch', (event) => {
//   event.respondwith(handlerequest(event.request))
// })

// // your usdc polygon wallet address for receiving payments
// // important: replace this with your actual wallet address
// const usdc_wallet = '0xda74a12a42e88ba7c9ccaeb1519a10f3423d4c85'

// // optional: custom checkout domain for display (leave as is if not using)
// // this will replace checkout.paygate.to in api responses
// const custom_checkout_domain = 'checkout.example.com'

// // paygate api base url (do not change)
// const paygate_api_url = 'https://api.paygate.to'
// const paygate_checkout_url = 'https://checkout.paygate.to'

// async function handlerequest(request) {
//   const url = new url(request.url)
//   const path = url.pathname
//   const searchparams = url.searchparams

//   // add wallet parameter if not present and wallet is configured
//   if (
//     usdc_wallet &&
//     usdc_wallet !== '0xda74a12a42e88ba7c9ccaeb1519a10f3423d4c85' &&
//     !searchparams.has('wallet')
//   ) {
//     searchparams.set('wallet', usdc_wallet)
//   }

//   // determine target endpoint
//   let targeturl

//   if (path.startswith('/crypto/')) {
//     // crypto payment endpoints
//     targeturl = `${paygate_api_url}${path}?${searchparams.tostring()}`
//   } else if (path.startswith('/create.php') || path === '/create.php') {
//     // credit card payment creation
//     targeturl = `${paygate_api_url}/create.php?${searchparams.tostring()}`
//   } else if (path.startswith('/status.php') || path === '/status.php') {
//     // payment status check
//     targeturl = `${paygate_api_url}/status.php?${searchparams.tostring()}`
//   } else {
//     // default: proxy to paygate api
//     targeturl = `${paygate_api_url}${path}?${searchparams.tostring()}`
//   }

//   // create new request
//   const modifiedrequest = new request(targeturl, {
//     method: request.method,
//     headers: request.headers,
//     body: request.body,
//   })

//   // fetch from paygate
//   const response = await fetch(modifiedrequest)

//   // clone response to modify if needed
//   const clonedresponse = response.clone()
//   const responsetext = await clonedresponse.text()

//   // if response contains checkout url, optionally replace domain
//   let modifiedresponsetext = responsetext
//   if (
//     custom_checkout_domain &&
//     custom_checkout_domain !== 'checkout.example.com' &&
//     responsetext.includes('checkout.paygate.to')
//   ) {
//     modifiedresponsetext = responsetext.replace(
//       /checkout\.paygate\.to/g,
//       custom_checkout_domain,
//     )
//   }

//   // return response with cors headers
//   return new response(modifiedresponsetext, {
//     status: response.status,
//     statustext: response.statustext,
//     headers: {
//       ...object.fromentries(response.headers),
//       'access-control-allow-origin': '*',
//       'access-control-allow-methods': 'get, post, options',
//       'access-control-allow-headers': 'content-type',
//     },
//   })
// }
