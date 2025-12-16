# PayGate Payment Gateway Integration

This document describes the PayGate.to payment gateway integration for handling both credit card and cryptocurrency payments.

## Overview

PayGate.to is a payment gateway that supports:
- **Credit Card Payments**: Visa, Mastercard, American Express, Google Pay, Apple Pay
- **Cryptocurrency Payments**: Bitcoin, Ethereum, USDC, USDT, and more
- **No API Keys Required**: Simply configure your USDC Polygon wallet address
- **White-Label Support**: Use custom domains via Cloudflare Workers

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# PayGate API Configuration (optional - defaults to PayGate.to)
PAYGATE_API_URL=https://api.paygate.to
PAYGATE_CHECKOUT_URL=https://checkout.paygate.to

# USDC Polygon Wallet Address (required)
PAYGATE_USDC_WALLET=0x...

# Webhook Secret (optional, for webhook verification)
PAYGATE_WEBHOOK_SECRET=your_secret_here

# Enable/Disable PayGate (default: enabled)
PAYGATE_ENABLED=true
```

### Admin Panel Configuration

1. Navigate to `/admin/settings`
2. Scroll to the "PayGate Payment Gateway" section
3. Configure:
   - **Enable PayGate Integration**: Toggle to enable/disable
   - **API URL**: Custom PayGate API domain (leave empty for default)
   - **Checkout URL**: Custom PayGate checkout domain (leave empty for default)
   - **USDC Polygon Wallet Address**: Your wallet address to receive payments

Admin settings override environment variables.

## Payment Flow

### 1. Order Creation

When a customer places an order with `credit_card` or `crypto` payment method:

1. Order is created with `pending` payment status
2. Customer is redirected to `/order/[orderId]/payment`
3. Payment page initiates PayGate payment session
4. Customer is redirected to PayGate checkout

### 2. Payment Processing

- **Credit Card**: Customer completes payment on PayGate hosted checkout
- **Cryptocurrency**: Customer receives wallet address and QR code for payment

### 3. Payment Completion

- PayGate sends webhook to `/api/paygate/webhook`
- Order payment status is updated to `completed`
- Order status changes from `pending` to `confirmed`
- Customer is redirected back to order confirmation page

## API Endpoints

### Payment Initiation

**Action**: `api.orders.paygate.initiatePayGatePayment`

```typescript
const result = await initiatePayment({
  orderId: '...',
  returnUrl: 'https://yoursite.com/account/orders/...',
  cancelUrl: 'https://yoursite.com/order/.../payment?payment=cancelled',
  webhookUrl: 'https://yoursite.com/api/paygate/webhook',
})
```

### Payment Status Check

**Action**: `api.orders.paygate.checkPayGatePaymentStatus`

```typescript
const status = await checkPaymentStatus({
  orderId: '...',
})
```

## Webhook Handler

The webhook endpoint at `/api/paygate/webhook` handles payment status updates from PayGate.

**Expected PayGate Webhook Payload**:

```json
{
  "session_id": "session_123",
  "order_id": "ORD-2024-001234",
  "transaction_id": "txn_456",
  "status": "completed",
  "amount": 100.50,
  "currency": "USD",
  "paid_at": 1234567890
}
```

## White-Label Setup (Custom Domain)

To use your own custom domain with PayGate, see the comprehensive guide:

📖 **[Complete White-Label Setup Guide](./PAYGATE_WHITELABEL_SETUP.md)**

Quick overview:

1. **Set up Cloudflare DNS**:
   - Add your domain to Cloudflare
   - Create DNS A records for `api.yourdomain.com` and `checkout.yourdomain.com`
   - Enable proxy (orange cloud)

2. **Create Cloudflare Worker**:
   - Use the worker code from `cloudflare-workers/paygate-worker.js`
   - Configure your USDC wallet address in the worker
   - Route your domains to the worker

3. **Update Configuration**:
   - Set `PAYGATE_API_URL` to `https://api.yourdomain.com`
   - Set `PAYGATE_CHECKOUT_URL` to `https://checkout.yourdomain.com`
   - Or configure via admin panel at `/admin/settings`

**Worker Templates Available**:
- `cloudflare-workers/paygate-worker.js` - Standard white-label worker
- `cloudflare-workers/paygate-worker-affiliate.js` - With affiliate commission support

See [PayGate White-Label Guide](https://paygate.to/white-label-api-custom-domain-guide/) for additional details.

## Supported Payment Methods

### Credit Card
- Visa
- Mastercard
- American Express
- Google Pay
- Apple Pay

### Cryptocurrency
- Bitcoin (BTC)
- Ethereum (ETH)
- USDC (Polygon)
- USDT (various networks)
- And more (see PayGate API docs)

## Order Schema Updates

Orders now include PayGate-specific fields:

```typescript
payment: {
  method: 'credit_card' | 'crypto' | 'cashapp',
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  paygateSessionId?: string,
  paygatePaymentUrl?: string,
  paygateTransactionId?: string,
  transactionId?: string,
  paidAt?: number,
}
```

## Testing

### Test Payment Flow

1. Create a test order with `credit_card` or `crypto` payment method
2. Complete payment on PayGate checkout
3. Verify webhook updates order status
4. Check order detail page shows payment information

### Webhook Testing

Use a tool like ngrok to expose your local webhook endpoint:

```bash
ngrok http 3000
# Use the ngrok URL in PayGate webhook configuration
```

## Troubleshooting

### Payment Not Initializing

- Check PayGate settings in admin panel
- Verify USDC wallet address is configured
- Check browser console for errors
- Verify order was created successfully

### Webhook Not Receiving Updates

- Verify webhook URL is accessible
- Check PayGate webhook configuration
- Review server logs for webhook errors
- Ensure webhook endpoint returns 200 status

### Payment Status Not Updating

- Check webhook is being called
- Verify order ID matches in webhook payload
- Review payment status check action logs
- Manually check payment status via PayGate API

## Security Considerations

- Webhook endpoint should validate requests (add signature verification if needed)
- Store sensitive configuration in environment variables
- Use HTTPS for all PayGate API calls
- Validate order ownership before updating payment status
- Rate limit webhook endpoint to prevent abuse

## Resources

- [PayGate.to Website](https://paygate.to)
- [PayGate API Documentation](https://paygate.to/api-docs)
- [White-Label Guide](https://paygate.to/white-label-api-custom-domain-guide/)
- [GitHub Repository](https://github.com/paygate-to/white-label-api)

## Support

For PayGate-specific issues, contact PayGate support or refer to their documentation.

For integration issues, check:
- Order logs in admin panel
- Server error logs
- Browser console errors
- Webhook delivery logs
