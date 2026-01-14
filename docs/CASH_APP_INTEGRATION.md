# Cash App Pay Integration

This document describes the Cash App Pay integration for handling Cash App payments in the checkout flow.

## Overview

Cash App Pay is powered by Square's payment infrastructure and allows customers to pay using their Cash App accounts. The integration includes:

- **Frontend**: Cash App checkout route and payment components
- **Backend**: Convex actions for payment initiation and status checking
- **SDK Integration**: Square Web Payments SDK for Cash App Pay

## Setup Requirements

### 1. Square Developer Account

Cash App Pay requires:
- Square Developer account
- Partner approval from Cash App (for production use)
- Square Application ID (for frontend SDK)
- Square Access Token (for backend API)
- Square Location ID (optional)

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Square Application ID (for frontend SDK)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_application_id

# Square Access Token (for backend API - server-side only)
SQUARE_ACCESS_TOKEN=your_access_token

# Square Location ID (optional)
SQUARE_LOCATION_ID=your_location_id

# Square Environment: 'sandbox' or 'production'
SQUARE_ENVIRONMENT=sandbox
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox

# Enable/Disable Cash App Pay
CASH_APP_ENABLED=true
NEXT_PUBLIC_CASH_APP_ENABLED=true
```

### 3. Admin Panel Configuration

You can also configure Cash App settings in the admin panel at `/admin/settings` (if implemented):

- **Square Application ID**: For frontend SDK
- **Square Access Token**: For backend API calls
- **Square Location ID**: Optional location identifier
- **Environment**: Sandbox or Production

## Payment Flow

### 1. Order Creation

When a customer places an order with `cashapp` payment method:

1. Order is created with `pending` payment status
2. Customer is redirected to `/lobby/order/[orderId]/cashapp`
3. Cash App payment page initiates payment session
4. Customer completes payment using Cash App Pay SDK

### 2. Payment Processing

- **Desktop**: Customer sees QR code to scan with Cash App mobile app
- **Mobile**: Customer is redirected to Cash App for payment authorization

### 3. Payment Completion

- Square API sends payment confirmation
- Order payment status is updated to `completed`
- Order status changes from `pending_payment` to `order_processing`
- Customer is redirected to order confirmation page

## File Structure

```
app/lobby/(store)/order/[orderId]/cashapp/
  ├── page.tsx                    # Main Cash App checkout page
  ├── cashapp-processing.tsx      # Payment processing component
  ├── cashapp-success.tsx         # Payment success component
  ├── cashapp-error.tsx           # Payment error component
  └── cashapp-payment-sdk.tsx      # Square SDK integration

lib/cashapp/
  ├── config.ts                   # Configuration
  ├── types.ts                    # TypeScript types
  └── client.ts                   # Server-side API client (for reference)

convex/orders/
  └── cashapp.ts                  # Convex actions for payment processing

hooks/
  └── use-cashapp.ts              # React hook for Cash App payments
```

## API Endpoints

### Payment Initiation

**Action**: `api.orders.cashapp.initiateCashAppPayment`

```typescript
const result = await initiatePayment({
  orderId: '...',
  returnUrl: 'https://yoursite.com/account/orders/...',
  cancelUrl: 'https://yoursite.com/order/.../cashapp?payment=cancelled',
})
```

### Payment Status Check

**Action**: `api.orders.cashapp.checkCashAppPaymentStatus`

```typescript
const status = await checkPaymentStatus({
  orderId: '...',
})
```

## Integration Notes

### Cash App Pay Partner Approval

**Important**: Cash App Pay requires partner approval before going to production. The integration is set up and ready, but you'll need to:

1. Apply for Cash App Pay partner status
2. Complete the approval process
3. Receive your production credentials
4. Update environment variables with production credentials

### SDK Integration

The Cash App Payment SDK component (`cashapp-payment-sdk.tsx`) loads Square's Web Payments SDK. The actual API may vary based on:

- Your partner approval status
- Square SDK version
- Cash App Pay API updates

You may need to adjust the SDK integration based on the official Cash App Pay documentation once you have partner access.

### Testing

Use Square's sandbox environment for testing:

1. Set `SQUARE_ENVIRONMENT=sandbox`
2. Use sandbox credentials
3. Test payment flow in sandbox mode
4. Verify payment status updates correctly

## Troubleshooting

### Payment Not Initializing

- Check that `SQUARE_ACCESS_TOKEN` is set correctly
- Verify `NEXT_PUBLIC_SQUARE_APPLICATION_ID` is configured
- Ensure Cash App Pay is enabled in environment variables

### SDK Not Loading

- Check browser console for script loading errors
- Verify the SDK script URL is accessible
- Check that `applicationId` is passed correctly to the component

### Payment Status Not Updating

- Verify webhook endpoints are configured (if using webhooks)
- Check that payment status polling is working
- Review Square API response for errors

## References

- [Cash App Pay Partner API Documentation](https://developers.cash.app/cash-app-pay-partner-api)
- [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview)
- [Square Payments API](https://developer.squareup.com/reference/square/payments-api)
