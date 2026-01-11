import {Infer, v} from 'convex/values'

/**
 * Affiliate Account Schema
 *
 * Stores affiliate wallet addresses and commission settings.
 * Affiliates earn commissions on PayGate transactions.
 */
export const affiliateAccountSchema = v.object({
  paygateAccount: v.id('paygateAccounts'),
  // Wallet address - primary identifier
  walletAddress: v.string(), // Affiliate wallet address (Ethereum/Polygon)

  // Account metadata
  label: v.optional(v.string()), // Admin-friendly label/name
  description: v.optional(v.string()), // Optional description

  // Commission settings
  commissionRate: v.optional(v.number()), // Commission rate (e.g., 0.005 for 0.5%)
  merchantRate: v.optional(v.number()), // Commission rate (e.g., 0.005 for 0.5%)
  enabled: v.optional(v.boolean()), // Whether affiliate commissions are enabled

  // Statistics (can be synced from PayGate API or tracked separately)
  totalCommissions: v.optional(v.number()), // Total commissions earned (USD)
  totalTransactions: v.optional(v.number()), // Total transactions referred
  successfulTransactions: v.optional(v.number()), // Count of successful transactions

  // Timestamps
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  createdBy: v.optional(v.string()), // User ID who created this affiliate
})

export type AffiliateAccountType = Infer<typeof affiliateAccountSchema>
