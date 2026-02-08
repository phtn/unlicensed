import { useCallback, useMemo } from 'react'
import { type Address, type Chain, formatEther, parseEther } from 'viem'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useCrypto } from './use-crypto'

interface SendParams {
  /** Recipient address. Defaults to a predefined address if not provided. */
  to?: Address
  /** Amount in USD to send */
  usd: number
  /** Optional chain ID for the transaction */
  chainId?: Chain['id']
}

interface UseSendReturn {
  /** Send a transaction with USD amount */
  send: (params: SendParams) => void
  /** Current ETH price in USD */
  ethPrice: number | null
  /** Transaction state from wagmi - true when waiting for wallet confirmation */
  isPending: boolean
  /** True when waiting for on-chain confirmation */
  isConfirming: boolean
  /** Transaction error, if any */
  error: Error | null
  /** Transaction hash, if successful */
  hash: `0x${string}` | undefined
  /** Transaction receipt, if confirmed */
  receipt: { blockNumber: bigint; status: 'success' | 'reverted' } | null
  /** Convert ETH amount (in wei) to USD */
  ethToUsd: (eth: bigint) => number | null
  /** Convert USD amount to ETH (returns string for parseEther) */
  usdToEth: (usd: number) => string | null
}

const DEFAULT_RECIPIENT: Address = '0x611F3143b76a994214d751d762b52D081d8DC4de'
const FALLBACK_ETH_PRICE = 3039.96
const MIN_USD_AMOUNT = 0.01

/**
 * Hook for sending ETH transactions with USD amount conversion.
 * Uses real-time ETH price from the crypto API when available.
 */
export const useSend = (): UseSendReturn => {
  const { getBySymbol } = useCrypto()
  const { mutateAsync, isPending, error, data: transactionHash } = useSendTransaction()

  // Wait for transaction receipt once we have a hash
  // Note: wagmi's useWaitForTransactionReceipt automatically cleans up the refetchInterval
  // when the component unmounts or when the query is disabled
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
    data: receipt,
    fetchStatus
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
    query: {
      enabled: !!transactionHash,
      retry: 5,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchInterval: (query) => {
        // Stop polling once we have a receipt
        if (query.state.data) {
          return false
        }
        // Poll every 2 seconds while waiting
        return 2000
      }
    }
  })

  // Get current ETH price
  const ethQuote = useMemo(() => getBySymbol('ETH'), [getBySymbol])
  const ethPrice = ethQuote?.price ?? null

  /**
   * Convert ETH amount (in wei) to USD
   */
  const ethToUsd = useCallback(
    (eth: bigint): number | null => {
      const price = ethPrice ?? FALLBACK_ETH_PRICE
      const ethAmount = Number(formatEther(eth))
      return ethAmount * price
    },
    [ethPrice]
  )

  /**
   * Convert USD amount to ETH string (for use with parseEther)
   * Returns null if ETH price is not available
   */
  const usdToEth = useCallback(
    (usd: number): string | null => {
      const price = ethPrice ?? FALLBACK_ETH_PRICE
      if (price <= 0) return null

      const ethAmount = usd / price
      // Use toFixed(18) to ensure we have enough precision for parseEther
      // parseEther can handle up to 18 decimal places
      return ethAmount.toFixed(18)
    },
    [ethPrice]
  )

  /**
   * Send a transaction with USD amount
   */
  const send = useCallback(
    (params: SendParams): void => {
      const { to = DEFAULT_RECIPIENT, usd } = params

      // Validate USD amount
      if (usd <= 0) {
        throw new Error('USD amount must be greater than 0')
      }

      if (usd < MIN_USD_AMOUNT) {
        throw new Error(`USD amount must be at least $${MIN_USD_AMOUNT}`)
      }

      // Convert USD to ETH
      const ethString = usdToEth(usd)
      if (!ethString) {
        throw new Error('Unable to convert USD to ETH: ETH price not available')
      }

      try {
        const value = parseEther(ethString)

        if (process.env.NODE_ENV === 'development') {
          console.table({
            'USD Amount': `$${usd.toFixed(2)}`,
            'ETH Amount': ethString,
            'Wei Value': value.toString(),
            'ETH Price': `$${ethPrice?.toFixed(2) ?? FALLBACK_ETH_PRICE.toFixed(2)}`,
            Recipient: to
          })
        }

        mutateAsync({
          to,
          value
        })
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? `Failed to send transaction: ${err.message}`
            : 'Failed to send transaction: Unknown error'
        )
      }
    },
    [mutateAsync, usdToEth, ethPrice]
  )

  // Determine if we're still confirming - we have a hash but no receipt yet
  const isStillConfirming = useMemo(() => {
    if (!transactionHash) return false
    // If we have a receipt, we're done confirming
    if (receipt) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Receipt received:', { blockNumber: receipt.blockNumber, status: receipt.status })
      }
      return false
    }
    // If it's confirmed (isSuccess), we're done even if receipt is null (shouldn't happen but safety check)
    if (isConfirmed) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Transaction confirmed (isSuccess=true)')
      }
      return false
    }
    // If there's an error, stop confirming (transaction might have failed or RPC issue)
    if (isReceiptError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Receipt error:', receiptError)
      }
      // Still return false to stop showing loading, but error will be shown
      return false
    }
    // Log polling status in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('⏳ Still confirming:', {
        isConfirming,
        fetchStatus,
        hasReceipt: !!receipt,
        isConfirmed,
        isError: isReceiptError
      })
    }
    // Only show confirming if actively fetching and not in error state
    return (isConfirming || fetchStatus === 'fetching') && !isReceiptError
  }, [transactionHash, receipt, isConfirmed, isConfirming, fetchStatus, isReceiptError, receiptError])

  return {
    send,
    ethPrice,
    isPending,
    isConfirming: isStillConfirming,
    error: (error || receiptError) as Error | null,
    hash: transactionHash,
    receipt: receipt
      ? {
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted'
        }
      : null,
    ethToUsd,
    usdToEth
  }
}

/**
 * Convert ETH amount (in wei) to USD using a static price.
 * @deprecated Use useSend().ethToUsd() for real-time prices
 */
export const eth_2_usd = (eth: bigint, price: number = FALLBACK_ETH_PRICE): number => {
  const ethAmount = Number(formatEther(eth))
  return ethAmount * price
}
