import {createClient} from 'swapped-commerce-sdk'

/**
 * Server-side Swapped Commerce SDK Client
 * Uses private API key (SWAPPED_API_PK) if available, falls back to public key
 * This should only be used in server-side code (API routes, server components)
 */
export const swappedServer = createClient({
  apiKey:
    process.env.SWAPPED_API_PK || process.env.NEXT_PUBLIC_SWAPPED_API_PK || '',
  environment: 'sandbox',
})
