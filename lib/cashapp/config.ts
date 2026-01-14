/**
 * Cash App Pay Configuration
 * 
 * Configuration for Square/Cash App Pay integration.
 * Requires Square Developer account and application credentials.
 */

export interface CashAppConfig {
  // Square Application ID (required for frontend SDK)
  applicationId: string
  // Square Location ID (optional, can be set per payment)
  locationId?: string
  // Server-side access token (required for backend API calls)
  accessToken?: string
  // Environment: 'sandbox' or 'production'
  environment: 'sandbox' | 'production'
  // Enable/disable Cash App Pay
  enabled: boolean
}

// Server-side configuration (from environment variables)
export const cashAppConfig: CashAppConfig = {
  applicationId: process.env.SQUARE_APPLICATION_ID || '',
  locationId: process.env.SQUARE_LOCATION_ID,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  enabled: process.env.CASH_APP_ENABLED !== 'false', // Default to enabled if not set
}

// Client-side configuration (public only)
export const cashAppPublicConfig = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '',
  environment:
    (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production') ||
    'sandbox',
  enabled: process.env.NEXT_PUBLIC_CASH_APP_ENABLED !== 'false',
} as const
