import {Infer, v} from 'convex/values'

export const topTenProviderValidator = v.object({
  id: v.string(),
  provider_name: v.string(),
  status: v.union(
    v.literal('active'),
    v.literal('inactive'),
    v.literal('redirected'),
    v.literal('unstable'),
  ),
  minimum_currency: v.string(),
  minimum_amount: v.number(),
})

export const gatewayValidator = v.union(
  v.literal('paygate'),
  v.literal('paylex'),
  v.literal('rampex'),
)

export const apiKeyValidator = v.object({
  name: v.string(),
  value: v.string(),
})

export const walletValidator = v.object({
  addressIn: v.string(), // address_in from PayGate API (where payments are received)
  label: v.string(), // label from PayGate API (name of the wallet)
  description: v.optional(v.string()), // description from PayGate API (additional information)
  hexAddress: v.string(),
  polygonAddressIn: v.string(),
  callbackUrl: v.string(),
  ipnToken: v.string(),
  addressOut: v.optional(v.string()), // address_out from PayGate API (where payments are sent)
  // Affiliate settings
  affiliateWallet: v.optional(v.string()), // Affiliate wallet address for commissions
  commissionRate: v.optional(v.number()), // Commission rate (e.g., 0.005 for 0.5%)
  affiliateEnabled: v.optional(v.boolean()), // Whether affiliate commissions are enabled
  // PayGate API fetched data
  accountStatus: v.optional(
    v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('suspended'),
      v.literal('pending'),
    ),
  ),
  createdAt: v.optional(v.number()),
  isDefault: v.optional(v.boolean()),
  enabled: v.optional(v.boolean()),
})

/**
 * Gateway Schema
 *
 * Based on PayGate account schema. Stores gateway credentials and metadata.
 * Includes api_keys array for gateway-specific API credentials.
 */
export const gatewaySchema = v.object({
  // Gateway (paygate | paylex | rampex). Omitted = paygate for backward compat.
  gateway: v.optional(gatewayValidator),

  accounts: v.optional(v.array(walletValidator)),
  // Wallet address (Polygon USDC) - primary identifier
  // API keys for the gateway
  apiKeys: v.optional(v.array(apiKeyValidator)),

  // Account metadata
  label: v.optional(v.string()), // Admin-friendly label/name
  description: v.optional(v.string()), // Optional description
  defaultProvider: v.optional(v.string()),
  topTenProviders: v.optional(v.array(topTenProviderValidator)),

  paymentStatus: v.optional(
    v.union(v.literal('enabled'), v.literal('disabled'), v.literal('limited')),
  ),
  verificationStatus: v.optional(
    v.union(
      v.literal('verified'),
      v.literal('unverified'),
      v.literal('pending'),
      v.literal('rejected'),
    ),
  ),

  // Defaults

  apiUrl: v.optional(v.string()),
  checkoutUrl: v.optional(v.string()),
  webhookSecret: v.optional(v.string()),

  // Account statistics (from PayGate API)
  totalTransactions: v.optional(v.number()),
  totalVolume: v.optional(v.number()),
  successfulTransactions: v.optional(v.number()),
  failedTransactions: v.optional(v.number()),
  pendingAmount: v.optional(v.number()),
  availableBalance: v.optional(v.number()),

  // Limits and fees
  minTransactionAmount: v.optional(v.number()),
  maxTransactionAmount: v.optional(v.number()),
  dailyLimit: v.optional(v.number()),
  transactionFee: v.optional(v.number()),

  // Currency and payment settings
  supportedCurrencies: v.optional(v.array(v.string())),
  defaultCurrency: v.optional(v.string()),

  // Dates
  lastPaymentDate: v.optional(v.number()),
  lastSyncedAt: v.optional(v.number()),
  syncedData: v.optional(v.any()),

  // Configuration
  isDefault: v.optional(v.boolean()),
  enabled: v.optional(v.boolean()),

  // Timestamps
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  createdBy: v.optional(v.string()),
})

export type GatewayType = Infer<typeof gatewaySchema>
export type TopTenProvider = Infer<typeof topTenProviderValidator>

export type GatewayWallet = Infer<typeof walletValidator>
export type ApiKey = Infer<typeof apiKeyValidator>
export type GatewayId = Infer<typeof gatewayValidator>
