# PayGate White-Label Setup Guide

This guide walks you through setting up a white-label PayGate integration using your own custom domain. You can use either:

1. **Cloudflare Workers** (serverless, no server management)
2. **Self-Hosted Proxy Server** (full control, uses your dedicated server)

Choose the option that best fits your infrastructure.

## Overview

White-labeling allows you to use your own domain (e.g., `api.yourdomain.com` and `checkout.yourdomain.com`) instead of PayGate's default domains. This provides a seamless, branded payment experience for your customers.

## Prerequisites

- A domain name
- Access to your domain's DNS settings
- USDC Polygon wallet address
- **For Cloudflare**: Cloudflare account (free plan works)
- **For Self-Hosted**: Dedicated web server with Node.js/Bun and optionally Nginx

## Choose Your Setup Method

### Option 1: Cloudflare Workers (Recommended for Most Users)
- ✅ No server management
- ✅ Global edge network
- ✅ Free tier available
- ✅ Easy setup

[Go to Cloudflare Setup →](#step-1-set-up-cloudflare-dns)

### Option 2: Self-Hosted Proxy Server
- ✅ Full control
- ✅ No vendor lock-in
- ✅ Custom configurations
- ✅ Use existing server infrastructure

[Go to Self-Hosted Setup →](#self-hosted-setup)

## Step 1: Set Up Cloudflare DNS

1. **Add Your Domain to Cloudflare**:
   - Sign up or log in to [Cloudflare](https://cloudflare.com)
   - Add your domain to Cloudflare
   - Follow the instructions to update your domain's nameservers at your registrar

2. **Create DNS Records**:
   - Go to DNS settings in Cloudflare
   - Create A records for your subdomains:
     - `api.yourdomain.com` → `8.8.8.8` (IP doesn't matter, will be proxied)
     - `checkout.yourdomain.com` → `8.8.8.8`
   - **Important**: Enable the proxy (orange cloud) for both records

## Step 2: Create Cloudflare Worker

1. **Create a New Worker**:
   - In Cloudflare dashboard, go to Workers & Pages
   - Click "Create application" → "Create Worker"
   - Name it (e.g., "paygate-proxy")

2. **Add Worker Code**:
   - Copy the worker code from `cloudflare-workers/paygate-worker.js` (see below)
   - Paste it into the worker editor
   - Replace `YOUR_USDC_WALLET_ADDRESS` with your actual USDC Polygon wallet address
   - Replace `checkout.example.com` with your checkout domain (optional, for display)

3. **Deploy the Worker**:
   - Click "Save and deploy"

## Step 3: Route Your Domain to the Worker

1. **Add Custom Domain Route**:
   - In your worker settings, go to "Triggers"
   - Click "Add Custom Domain" or "Add Route"
   - Add routes:
     - `api.yourdomain.com/*`
     - `checkout.yourdomain.com/*`
   - The `*` wildcard ensures all paths are handled

2. **Verify Routes**:
   - Wait a few minutes for DNS propagation
   - Test by visiting `https://api.yourdomain.com` (should not error)

## Step 4: Configure in Admin Panel

1. **Update PayGate Settings**:
   - Go to `/admin/settings` in your application
   - Scroll to "PayGate Payment Gateway"
   - Set:
     - **API URL**: `https://api.yourdomain.com`
     - **Checkout URL**: `https://checkout.yourdomain.com`
     - **USDC Wallet**: Your wallet address (if not in worker code)
   - Click "Save Settings"

## Step 5: Test the Integration

1. **Create a Test Order**:
   - Place a test order with credit card or crypto payment
   - Verify the payment URL uses your custom domain
   - Complete the payment flow

2. **Verify Webhooks**:
   - Check that webhooks are received correctly
   - Verify order status updates properly

## Cloudflare Worker Code

Save this as `cloudflare-workers/paygate-worker.js`:

```javascript
/**
 * PayGate White-Label Cloudflare Worker
 * 
 * This worker proxies requests to PayGate API while using your custom domain.
 * Optionally injects affiliate wallet for commission tracking.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Your USDC Polygon wallet address for receiving payments
const USDC_WALLET = 'YOUR_USDC_WALLET_ADDRESS_HERE'

// Optional: Custom checkout domain for display (leave as is if not using)
const CUSTOM_CHECKOUT_DOMAIN = 'checkout.example.com'

// PayGate API base URL (DO NOT CHANGE)
const PAYGATE_API_URL = 'https://api.paygate.to'
const PAYGATE_CHECKOUT_URL = 'https://checkout.paygate.to'

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  const searchParams = url.searchParams

  // Add wallet parameter if not present and wallet is configured
  if (USDC_WALLET && !searchParams.has('wallet')) {
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
  if (CUSTOM_CHECKOUT_DOMAIN && responseText.includes('checkout.paygate.to')) {
    modifiedResponseText = responseText.replace(
      /checkout\.paygate\.to/g,
      CUSTOM_CHECKOUT_DOMAIN
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
```

## Alternative: Affiliate Version (With Commission)

If you want to earn affiliate commissions, use this version instead:

```javascript
/**
 * PayGate White-Label Cloudflare Worker (Affiliate Version)
 * 
 * This version automatically adds your affiliate wallet to earn 0.5% commission
 * on all transactions processed through your custom domain.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Your USDC Polygon wallet address for receiving payments
const USDC_WALLET = 'YOUR_USDC_WALLET_ADDRESS_HERE'

// Your affiliate wallet address (for earning commission)
const AFFILIATE_WALLET = 'YOUR_AFFILIATE_WALLET_ADDRESS_HERE'

// PayGate API base URL (DO NOT CHANGE)
const PAYGATE_API_URL = 'https://api.paygate.to'

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  const searchParams = url.searchParams

  // Add wallet parameter
  if (USDC_WALLET && !searchParams.has('wallet')) {
    searchParams.set('wallet', USDC_WALLET)
  }

  // Add affiliate parameter for commission (0.5% default)
  if (AFFILIATE_WALLET && !searchParams.has('affiliate')) {
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
```

## Self-Hosted Setup

If you have a dedicated web server, you can run your own proxy server instead of using Cloudflare Workers. This gives you full control and eliminates vendor lock-in.

### Step 1: Set Up DNS Records

1. **Create DNS A Records**:
   - Point `api.yourdomain.com` → Your server IP address
   - Point `checkout.yourdomain.com` → Your server IP address
   - Set TTL to 300 (5 minutes) for faster updates

### Step 2: Install and Configure Proxy Server

1. **Navigate to Proxy Server Directory**:
   ```bash
   cd server/paygate-proxy
   ```

2. **Install Dependencies**:
   ```bash
   bun install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file:
   ```env
   PORT=3001
   PAYGATE_USDC_WALLET=0xYourUSDCWalletAddress
   PAYGATE_AFFILIATE_WALLET=0xYourAffiliateWallet  # Optional
   CUSTOM_CHECKOUT_DOMAIN=checkout.yourdomain.com   # Optional
   ```

4. **Test the Server**:
   ```bash
   bun run dev
   ```

### Step 3: Set Up Nginx Reverse Proxy (Recommended)

1. **Install Nginx** (if not already installed):
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Copy Configuration**:
   ```bash
   sudo cp server/paygate-proxy/nginx.conf /etc/nginx/sites-available/paygate-proxy
   ```

3. **Edit Configuration**:
   - Update `server_name` directives with your domains
   - Update SSL certificate paths
   - Adjust upstream port if needed

4. **Set Up SSL Certificates** (Let's Encrypt):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com -d checkout.yourdomain.com
   ```

5. **Enable Site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/paygate-proxy /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Step 4: Run Proxy Server in Production

**Option A: Using PM2** (Recommended):
```bash
npm install -g pm2
bun run pm2:start
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

**Option B: Using Systemd**:
Create `/etc/systemd/system/paygate-proxy.service`:
```ini
[Unit]
Description=PayGate Proxy Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/server/paygate-proxy
EnvironmentFile=/path/to/server/paygate-proxy/.env
ExecStart=/usr/bin/bun run index.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable paygate-proxy
sudo systemctl start paygate-proxy
```

### Step 5: Configure Application

**Option A: Environment Variables (Recommended)**

Add to your `.env.local` file:

```env
# Server-side configuration - YOUR subdomains (NOT PayGate's domains)
# These point to your proxy server, which routes to PayGate internally
PAYGATE_API_URL=https://api.yourdomain.com
PAYGATE_CHECKOUT_URL=https://checkout.yourdomain.com

# Client-side configuration (required for browser access) - same YOUR subdomains
NEXT_PUBLIC_PAYGATE_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_PAYGATE_CHECKOUT_URL=https://checkout.yourdomain.com

# Wallet address (not needed if configured in proxy server .env file)
# PAYGATE_USDC_WALLET=0xYourUSDCWalletAddress
```

**Important**: Use YOUR subdomains (`api.yourdomain.com`, `checkout.yourdomain.com`), NOT PayGate's domains (`api.paygate.to`, `checkout.paygate.to`). Your proxy server handles routing to PayGate.

**Option B: Admin Panel**

1. Go to `/admin/settings` in your application
2. Set:
   - **API URL**: `https://api.yourdomain.com` (YOUR subdomain, not PayGate's)
   - **Checkout URL**: `https://checkout.yourdomain.com` (YOUR subdomain, not PayGate's)
   - **USDC Wallet**: Your wallet address (optional - usually configured in proxy server .env)
3. Click "Save Settings"

Note: 
- Use YOUR subdomains that point to your proxy server, NOT PayGate's domains
- Admin settings override environment variables
- For client-side access, you still need `NEXT_PUBLIC_*` environment variables set to YOUR subdomains

### Step 6: Test the Integration

```bash
# Test API endpoint
curl https://api.yourdomain.com/info.php

# Test payment creation
curl "https://api.yourdomain.com/create.php?amount=10&order_id=TEST123"
```

### Self-Hosted Troubleshooting

- **Server not responding**: Check firewall (ports 80, 443, 3001)
- **502 Bad Gateway**: Verify proxy server is running on port 3001
- **SSL errors**: Check certificate paths and validity
- **DNS not resolving**: Verify DNS records and wait for propagation

See `server/paygate-proxy/README.md` for detailed documentation.

---

## Troubleshooting

### Cloudflare: Worker Not Responding

- Verify DNS records are proxied (orange cloud enabled)
- Check worker routes are configured correctly
- Wait 5-10 minutes for DNS propagation

### Cloudflare: Payment URLs Still Show PayGate Domain

- Verify worker code is deployed
- Check that routes are set up correctly
- Clear browser cache
- Verify admin settings are saved

### Cloudflare: CORS Errors

- The worker includes CORS headers
- If issues persist, check browser console for specific errors
- Verify the request is going through your custom domain

### Cloudflare: Wallet Not Receiving Payments

- Verify USDC wallet address is correct in worker code
- Check that wallet parameter is being added
- Test with a small payment first

## Security Considerations

- Keep your wallet address secure
- Don't commit worker code with real wallet addresses to public repos
- Use Cloudflare's environment variables for sensitive data if needed
- Regularly monitor transactions

## Additional Resources

- [PayGate White-Label Guide](https://paygate.to/white-label-api-custom-domain-guide/)
- [PayGate GitHub Repository](https://github.com/paygate-to/white-label-api)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## Support

For PayGate-specific issues, contact PayGate support.

For Cloudflare Worker issues, refer to Cloudflare's documentation or support.
