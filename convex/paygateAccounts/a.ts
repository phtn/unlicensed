/**
 * PayGate Accounts Actions
 * 
 * Actions to sync account data from PayGate API
 */

import {v} from 'convex/values'
import {action} from '../_generated/server'
import {api} from '../_generated/api'
import type {AdminSettings} from '../admin/d'

/**
 * Sync account data from PayGate API
 * 
 * Fetches account information and payment status from PayGate API
 * using the wallet address as the identifier.
 */
export const syncAccountFromPayGate = action({
  args: {
    accountId: v.id('paygateAccounts'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean
    data?: Record<string, unknown>
    rawData?: unknown
    error?: string
  }> => {
    // Get account from database
    const account = (await ctx.runQuery(api.paygateAccounts.q.getAccountById, {
      id: args.accountId,
    })) as {addressIn: string} | null

    if (!account) {
      throw new Error('Account not found')
    }

    // Get admin settings for PayGate API URL
    const adminSettings = await ctx.runQuery(api.admin.q.getAdminSettings, {}) as AdminSettings | null
    const paygateSettings = adminSettings?.value?.paygate as
      | {apiUrl?: string}
      | undefined
    const apiUrl = paygateSettings?.apiUrl || 'https://api.paygate.to'

    try {
      // PayGate API endpoint for wallet/account info
      // Note: The exact endpoint may vary - this is a placeholder structure
      // Common patterns: /wallet.php, /account.php, /wallet/info.php
      const endpoints = [
        `${apiUrl}/wallet.php?wallet=${account.addressIn}`,
        `${apiUrl}/account.php?address=${account.addressIn}`,
        `${apiUrl}/wallet/info.php?wallet=${account.addressIn}`,
      ]

      let accountData: Record<string, unknown> | null = null
      let lastError: Error | null = null

      // Try different possible endpoints
      for (const endpoint of endpoints) {
        try {
          const response: Response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          })

          if (response.ok) {
            const data = (await response.json()) as Record<string, unknown>
            
            // Check if response has account data
            if (data && !data.error) {
              accountData = data
              break
            }
          }
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error(String(error))
          continue
        }
      }

      if (!accountData) {
        // If no data found, try status endpoint with wallet parameter
        try {
          const statusEndpoint: string = `${apiUrl}/status.php?wallet=${account.addressIn}`
          const statusResponse: Response = await fetch(statusEndpoint, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          })

          if (statusResponse.ok) {
            const statusData = (await statusResponse.json()) as Record<string, unknown>
            if (statusData && !statusData.error) {
              accountData = {status: statusData}
            }
          }
        } catch {
          // Ignore status endpoint errors
        }

        // If still no data, return error
        if (!accountData) {
          throw new Error(
            lastError?.message || 'Unable to fetch account data from PayGate API',
          )
        }
      }

      // Parse account data and extract relevant fields
      // This structure will depend on PayGate API response format
      const parsedData: {
        accountStatus?: 'active' | 'inactive' | 'suspended' | 'pending'
        paymentStatus?: 'enabled' | 'disabled' | 'limited'
        verificationStatus?: 'verified' | 'unverified' | 'pending' | 'rejected'
        addressOut?: string
        affiliateWallet?: string
        commissionRate?: number
        affiliateEnabled?: boolean
        totalTransactions?: number
        totalVolume?: number
        successfulTransactions?: number
        failedTransactions?: number
        pendingAmount?: number
        availableBalance?: number
        minTransactionAmount?: number
        maxTransactionAmount?: number
        dailyLimit?: number
        transactionFee?: number
        supportedCurrencies?: string[]
        defaultCurrency?: string
        lastPaymentDate?: number
      } = {}

      // Map common response fields
      if (accountData.status) {
        const status = String(accountData.status).toLowerCase()
        if (['active', 'inactive', 'suspended', 'pending'].includes(status)) {
          parsedData.accountStatus = status as
            | 'active'
            | 'inactive'
            | 'suspended'
            | 'pending'
        }
      }

      if (accountData.payment_status || accountData.paymentStatus) {
        const paymentStatus = String(
          accountData.payment_status || accountData.paymentStatus,
        ).toLowerCase()
        if (['enabled', 'disabled', 'limited'].includes(paymentStatus)) {
          parsedData.paymentStatus = paymentStatus as
            | 'enabled'
            | 'disabled'
            | 'limited'
        }
      }

      // Extract statistics if available
      if (typeof accountData.total_transactions === 'number') {
        parsedData.totalTransactions = accountData.total_transactions
      }
      if (typeof accountData.totalTransactions === 'number') {
        parsedData.totalTransactions = accountData.totalTransactions
      }

      if (typeof accountData.total_volume === 'number') {
        parsedData.totalVolume = accountData.total_volume
      }
      if (typeof accountData.totalVolume === 'number') {
        parsedData.totalVolume = accountData.totalVolume
      }

      if (typeof accountData.successful_transactions === 'number') {
        parsedData.successfulTransactions = accountData.successful_transactions
      }
      if (typeof accountData.successfulTransactions === 'number') {
        parsedData.successfulTransactions = accountData.successfulTransactions
      }

      if (typeof accountData.failed_transactions === 'number') {
        parsedData.failedTransactions = accountData.failed_transactions
      }
      if (typeof accountData.failedTransactions === 'number') {
        parsedData.failedTransactions = accountData.failedTransactions
      }

      // Extract affiliate fields
      if (typeof accountData.affiliate === 'string' || typeof accountData.affiliate_wallet === 'string') {
        parsedData.affiliateWallet = String(accountData.affiliate || accountData.affiliate_wallet)
      }
      if (typeof accountData.commission_rate === 'number') {
        parsedData.commissionRate = accountData.commission_rate
      }
      if (typeof accountData.commissionRate === 'number') {
        parsedData.commissionRate = accountData.commissionRate
      }
      if (typeof accountData.affiliate_enabled === 'boolean') {
        parsedData.affiliateEnabled = accountData.affiliate_enabled
      }
      if (typeof accountData.affiliateEnabled === 'boolean') {
        parsedData.affiliateEnabled = accountData.affiliateEnabled
      }

      // Extract address_out
      if (typeof accountData.address_out === 'string') {
        parsedData.addressOut = accountData.address_out
      }
      if (typeof accountData.addressOut === 'string') {
        parsedData.addressOut = accountData.addressOut
      }

      // Extract verification status
      if (accountData.verification_status) {
        const verificationStatus = String(accountData.verification_status).toLowerCase()
        if (['verified', 'unverified', 'pending', 'rejected'].includes(verificationStatus)) {
          parsedData.verificationStatus = verificationStatus as
            | 'verified'
            | 'unverified'
            | 'pending'
            | 'rejected'
        }
      }
      if (accountData.verificationStatus) {
        const verificationStatus = String(accountData.verificationStatus).toLowerCase()
        if (['verified', 'unverified', 'pending', 'rejected'].includes(verificationStatus)) {
          parsedData.verificationStatus = verificationStatus as
            | 'verified'
            | 'unverified'
            | 'pending'
            | 'rejected'
        }
      }

      // Extract pending amount and balance
      if (typeof accountData.pending_amount === 'number') {
        parsedData.pendingAmount = accountData.pending_amount
      }
      if (typeof accountData.pendingAmount === 'number') {
        parsedData.pendingAmount = accountData.pendingAmount
      }
      if (typeof accountData.available_balance === 'number') {
        parsedData.availableBalance = accountData.available_balance
      }
      if (typeof accountData.availableBalance === 'number') {
        parsedData.availableBalance = accountData.availableBalance
      }

      // Extract limits and fees
      if (typeof accountData.min_transaction_amount === 'number') {
        parsedData.minTransactionAmount = accountData.min_transaction_amount
      }
      if (typeof accountData.minTransactionAmount === 'number') {
        parsedData.minTransactionAmount = accountData.minTransactionAmount
      }
      if (typeof accountData.max_transaction_amount === 'number') {
        parsedData.maxTransactionAmount = accountData.max_transaction_amount
      }
      if (typeof accountData.maxTransactionAmount === 'number') {
        parsedData.maxTransactionAmount = accountData.maxTransactionAmount
      }
      if (typeof accountData.daily_limit === 'number') {
        parsedData.dailyLimit = accountData.daily_limit
      }
      if (typeof accountData.dailyLimit === 'number') {
        parsedData.dailyLimit = accountData.dailyLimit
      }
      if (typeof accountData.transaction_fee === 'number') {
        parsedData.transactionFee = accountData.transaction_fee
      }
      if (typeof accountData.transactionFee === 'number') {
        parsedData.transactionFee = accountData.transactionFee
      }

      // Extract currency settings
      if (Array.isArray(accountData.supported_currencies)) {
        parsedData.supportedCurrencies = accountData.supported_currencies
      }
      if (Array.isArray(accountData.supportedCurrencies)) {
        parsedData.supportedCurrencies = accountData.supportedCurrencies
      }
      if (typeof accountData.default_currency === 'string') {
        parsedData.defaultCurrency = accountData.default_currency
      }
      if (typeof accountData.defaultCurrency === 'string') {
        parsedData.defaultCurrency = accountData.defaultCurrency
      }

      // Extract last payment date
      if (typeof accountData.last_payment_date === 'number') {
        parsedData.lastPaymentDate = accountData.last_payment_date
      }
      if (typeof accountData.lastPaymentDate === 'number') {
        parsedData.lastPaymentDate = accountData.lastPaymentDate
      }
      if (typeof accountData.last_payment_at === 'number') {
        parsedData.lastPaymentDate = accountData.last_payment_at
      }
      if (typeof accountData.lastPaymentAt === 'number') {
        parsedData.lastPaymentDate = accountData.lastPaymentAt
      }

      // Update account with synced data
      await ctx.runMutation(api.paygateAccounts.m.updateAccountSyncData, {
        id: args.accountId,
        ...parsedData,
        syncedData: accountData,
      })

      return {
        success: true,
        data: parsedData,
        rawData: accountData,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to sync account data',
      }
    }
  },
})

