
![Rapid Fire Mural](../../public/rapid-fire-neon.webp)

---
<!--![Rapid Fire Neon](public/rapid-fire.webp)-->

# PayGate Self-Hosted Proxy Server

Self-hosted alternative to Cloudflare Workers for PayGate white-label integration.

## Goal

-  Proxy PayGate API requests through your own domain
-  Automatically inject USDC wallet address
-  Support affiliate commission tracking
-  Replace checkout domain in responses
-  CORS support
-  Built with Bun (fast and lightweight)

## Init

### 1. Install Deps
### 2. Configure Environment Variables

Create a `.env` file:

```env
PORT=3001
PAYGATE_USDC_WALLET=0xYourUSDCWalletAddress
PAYGATE_AFFILIATE_WALLET=0xYourAffiliateWallet  # Optional
CUSTOM_CHECKOUT_DOMAIN=checkout.yourdomain.com   # Optional
```

### 3. Run the Server

```zsh
# Prod
buns
```

### 4. Set Up DNS

Point your domains to your server:

```
api.yourdomain.com      → Our server IP
checkout.yourdomain.com → Our server IP
```

### 5. Configure Nginx (Recommended)

See `nginx.conf` for Nginx reverse proxy configuration.

1. Copy `nginx.conf` to `/etc/nginx/sites-available/paygate-proxy`
2. Update domain names in the config
3. Set up SSL certificates (Let's Encrypt recommended)
4. Enable the site: `sudo ln -s /etc/nginx/sites-available/paygate-proxy /etc/nginx/sites-enabled/`
5. Test and reload: `sudo nginx -t && sudo systemctl reload nginx`

### 6. Run with PM2 (Production)

```zsh
npm install -g pm2
bun run pm2:start

# View logs
pm2 logs paygate-proxy

# Stop
bun run pm2:stop
```

## Architecture

```zsh
Client Request
    ↓
api.yourdomain.com (DNS → Your Server IP)
    ↓
Nginx (SSL termination, reverse proxy)
    ↓
PayGate Proxy Server (Port 3001)
    ↓
PayGate API (api.paygate.to)
    ↓
Response (with wallet/affiliate injected)
    ↓
Client
```

## Configuration Options

### Envs

- `PORT` - Server port (default: 3001)
- `PAYGATE_USDC_WALLET` - Your USDC Polygon wallet address (required)
- `PAYGATE_AFFILIATE_WALLET` - Affiliate wallet for commissions (optional)
- `CUSTOM_CHECKOUT_DOMAIN` - Replace checkout domain in responses (optional)

### Nginx Configuration

The `nginx.conf` file includes:
- SSL/TLS termination
- Reverse proxy to Node.js/Bun server
- CORS headers
- Security headers
- Proper timeouts

## Testing

Test the proxy:

```zsh
# endpoint tests
curl https://api.yourdomain.com/info.php

# payment tests
curl "https://api.yourdomain.com/create.php?amount=10&order_id=TEST123&return_url=https://yoursite.com"
```

## Monitoring

### PM2 Monitoring

```bash
pm2 status
pm2 logs paygate-proxy
pm2 monit
```

### Systemd Service (Alternative)(Ask Serdar)

Create `/etc/systemd/system/paygate-proxy.service`:

```ini
[Unit]
Description=PayGate Proxy Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/server/paygate-proxy
Environment="PORT=3001"
Environment="PAYGATE_USDC_WALLET=0x..."
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
sudo systemctl status paygate-proxy
```

## Security Considerations

1. **SSL/TLS**: Always use HTTPS in production
2. **Firewall**: Only expose ports 80/443, keep 3001 internal
3. **Rate Limiting**: Consider adding rate limiting in Nginx
4. **Monitoring**: Set up logging and monitoring
5. **Updates**: Keep server and dependencies updated

## Troubleshooting

### Server Not Starting

- Check if port 3001 is available: `lsof -i :3001`
- Verify environment variables are set
- Check logs for errors

### DNS Not Resolving

- Verify DNS records are correct
- Wait for DNS propagation (can take up to 48 hours)
- Test with `dig api.yourdomain.com`

### SSL Certificate Issues

- Ensure certificates are valid and not expired
- Check certificate paths in Nginx config
- Use Let's Encrypt: `sudo certbot --nginx -d api.yourdomain.com`

### Proxy Errors

- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify proxy server is running: `curl http://localhost:3001`
- Check firewall rules

## Performance

- Bun runtime is very fast
- Nginx handles SSL termination efficiently
- Consider adding caching for static responses
- Monitor server resources

## Comparison: Self-Hosted vs Cloudflare Workers

| Feature           |   Self-Hosted      |  Cloudflare Workers     |
|-------------------|--------------------|-------------------------|
| Setup Complexity  |  Medium            | Low                     |
| Cost              |  Server costs      | Free Tier available     |
| Control           |  Full control      | Limited                 |
| Performance       |  Depends on server | Global CDN              |
| Maintenance       |  You manage        | Cloudflare manages      |
| Customization     |  Full              | Limited by Workers API  |
|-------------------|--------------------|-------------------------|

We will try self-hosted since we have our own web-server:
- We already have a dedicated server
- We need full control
- We want to avoid vendor lock-in
- We have specific requirements
- We can customize configs 

<!--Choose Cloudflare Workers if:
- You want zero server management
- You want global edge performance
- You prefer serverless architecture
- Free tier is sufficient-->









