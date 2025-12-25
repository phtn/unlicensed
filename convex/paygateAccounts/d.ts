import {Infer, v} from 'convex/values'

/**
 * PayGate Account Schema
 * 
 * Stores PayGate account credentials and metadata for wallet addresses.
 * The address_in is the Polygon wallet address used to identify the account.
 */
export const paygateAccountSchema = v.object({
  // Wallet address (Polygon USDC) - primary identifier
  addressIn: v.string(), // address_in from PayGate API (where payments are received)
  addressOut: v.optional(v.string()), // address_out from PayGate API (where payments are sent)
  
  // Account metadata
  label: v.optional(v.string()), // Admin-friendly label/name
  description: v.optional(v.string()), // Optional description
  
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
  ), // Account status from PayGate
  paymentStatus: v.optional(
    v.union(
      v.literal('enabled'),
      v.literal('disabled'),
      v.literal('limited'),
    ),
  ), // Payment processing status
  verificationStatus: v.optional(
    v.union(
      v.literal('verified'),
      v.literal('unverified'),
      v.literal('pending'),
      v.literal('rejected'),
    ),
  ), // Account verification status
  
  // Account statistics (from PayGate API)
  totalTransactions: v.optional(v.number()), // Total number of transactions
  totalVolume: v.optional(v.number()), // Total volume processed (USD)
  successfulTransactions: v.optional(v.number()), // Count of successful transactions
  failedTransactions: v.optional(v.number()), // Count of failed transactions
  pendingAmount: v.optional(v.number()), // Pending payment amount (USD)
  availableBalance: v.optional(v.number()), // Available balance (if applicable, USD)
  
  // Limits and fees
  minTransactionAmount: v.optional(v.number()), // Minimum transaction amount (USD)
  maxTransactionAmount: v.optional(v.number()), // Maximum transaction amount (USD)
  dailyLimit: v.optional(v.number()), // Daily transaction limit (USD)
  transactionFee: v.optional(v.number()), // Transaction fee percentage
  
  // Currency and payment settings
  supportedCurrencies: v.optional(v.array(v.string())), // Supported currencies (e.g., ['USD', 'BTC'])
  defaultCurrency: v.optional(v.string()), // Default currency (e.g., 'USD')
  
  // Dates
  lastPaymentDate: v.optional(v.number()), // Timestamp of last payment
  lastSyncedAt: v.optional(v.number()), // When account data was last fetched from PayGate
  syncedData: v.optional(v.any()), // Raw sync data from PayGate API
  
  // Configuration
  isDefault: v.optional(v.boolean()), // Whether this is the default account to use
  enabled: v.optional(v.boolean()), // Whether this account is enabled for use
  
  // Timestamps
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  createdBy: v.optional(v.string()), // User ID who created this account
})

export type PaygateAccountType = Infer<typeof paygateAccountSchema>

