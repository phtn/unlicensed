# PayGate Proxy Server Setup Checklist

## ✅ Server Configuration Required

### 1. Environment Variables
Create a `.env` file in the server directory or set system environment variables:

```env
# Required
PORT=3001
PAYGATE_USDC_WALLET=0xYourUSDCWalletAddress

# Optional
PAYGATE_AFFILIATE_WALLET=0xYourAffiliateWallet
CUSTOM_CHECKOUT_DOMAIN=checkout.yourdomain.com
```

**Note**: If `CUSTOM_CHECKOUT_DOMAIN` is set, it should match your checkout subdomain (e.g., `checkout.yourdomain.com`).

### 2. Nginx Configuration
✅ **Already configured** - Your nginx is set up to:
- Listen on `api.yourdomain.com` and `checkout.yourdomain.com`
- Proxy both subdomains to `http://127.0.0.1:3001` (port 3001)
- Handle SSL/TLS termination

**Important**: Ensure nginx is actually running and serving these subdomains:
```bash
sudo nginx -t  # Test configuration
sudo systemctl status nginx  # Check status
sudo systemctl reload nginx  # Reload if needed
```

### 3. Start Proxy Server
Run the proxy server on port 3001:

**Development:**
```bash
bun run server/paygate-proxy/index.ts
```

**Production (PM2):**
```bash
pm2 start server/paygate-proxy/index.ts --name paygate-proxy --interpreter bun
pm2 save
pm2 startup  # Follow instructions for auto-start on boot
```

**Production (Systemd):**
See `server/paygate-proxy/README.md` for systemd service configuration.

### 4. Verify Setup

**Test proxy server directly (should work without nginx):**
```bash
curl http://localhost:3001/info.php
```

**Test through nginx (your subdomains):**
```bash
curl https://api.yourdomain.com/info.php
curl https://checkout.yourdomain.com/info.php
```

## 📝 Configuration Notes

### Subdomain Config (`lib/subdomains/config.ts`)
**Status**: ✅ **Correct** - No changes needed

The `lib/subdomains/config.ts` file is for **Next.js internal routing**, NOT for the PayGate proxy. These are separate systems:

- **PayGate Proxy Subdomains**: `api.yourdomain.com`, `checkout.yourdomain.com`
  - Handled by nginx → proxy server (port 3001) → PayGate API
  - Configured in nginx, not in Next.js subdomain config

- **Next.js App Subdomains**: `admin.yourdomain.com`, `account.yourdomain.com`, etc.
  - Handled by Next.js app routing
  - Configured in `lib/subdomains/config.ts`

**Why they don't conflict:**
- Nginx intercepts `api.yourdomain.com` and `checkout.yourdomain.com` first
- These requests never reach Next.js (they go to the proxy server)
- Other subdomains (like `admin`, `account`) reach Next.js and use the subdomain config

### DNS Configuration
Ensure DNS records point to your server:
```
api.yourdomain.com      → Your Server IP
checkout.yourdomain.com → Your Server IP
```

### Application Configuration
Your Next.js app needs these environment variables (separate from proxy server):

```env
# Server-side
PAYGATE_API_URL=https://api.yourdomain.com
PAYGATE_CHECKOUT_URL=https://checkout.yourdomain.com

# Client-side (for browser access)
NEXT_PUBLIC_PAYGATE_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_PAYGATE_CHECKOUT_URL=https://checkout.yourdomain.com
```

**Important**: Use YOUR subdomains (e.g., `api.yourdomain.com`), NOT PayGate's domains (`api.paygate.to`). Your proxy server handles routing to PayGate internally.

## 🔍 Troubleshooting

### Proxy Server Not Starting
```bash
# Check if port 3001 is in use
lsof -i :3001

# Check environment variables
echo $PORT
echo $PAYGATE_USDC_WALLET

# Check proxy server logs
pm2 logs paygate-proxy  # If using PM2
```

### Nginx 502 Bad Gateway
- Verify proxy server is running: `curl http://localhost:3001`
- Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify upstream in nginx config points to `127.0.0.1:3001`

### DNS Not Resolving
```bash
# Test DNS resolution
dig api.yourdomain.com
dig checkout.yourdomain.com

# Check DNS propagation (can take up to 48 hours)
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew if needed
sudo certbot renew
```

## 📚 Additional Resources

- Full documentation: `server/paygate-proxy/README.md`
- Nginx config: `server/paygate-proxy/nginx.conf`
- Proxy server code: `server/paygate-proxy/index.ts`
- PayGate integration docs: `docs/PAYGATE_INTEGRATION.md`
- White-label setup: `docs/PAYGATE_WHITELABEL_SETUP.md`
