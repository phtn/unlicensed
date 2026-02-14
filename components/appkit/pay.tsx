import {useSearchParams} from '@/components/sepolia/search-params-context'
import {useCrypto} from '@/hooks/use-crypto'
import {useNetworkTokens} from '@/hooks/use-network-tokens'
import {usePayButtonState} from '@/hooks/use-pay-button-state'
import {useSend} from '@/hooks/x-use-send'
import {getTransactionExplorerUrl} from '@/lib/explorer'
import {Icon} from '@/lib/icons'
import {getUsdcAddress, isUsdcSupportedChain} from '@/lib/usdc'
import {getUsdtAddress, isUsdtSupportedChain} from '@/lib/usdt'
import {cn} from '@/lib/utils'
import {AnimatePresence, motion} from 'motion/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import {parseUnits, type Address} from 'viem'
import {
  useChainId,
  useChains,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import {AmountPayInput} from './amount-pay'
import {withSecureRetry} from './converter-utils'
import {NetworkSelector} from './network-selector'
import {PayAmount} from './pay-amount'
import {PayButtons} from './pay-buttons'
import {
  getChainIdForNetwork,
  getNativeSymbolForChainId,
  getNetworkForChainId,
  getPriceSymbolForChainId,
  getTokenFractionDigits,
  isEvmPayToken,
  parseTokenParam,
  type EvmPayToken,
} from './pay-config'
import {PaymentProcessing} from './payment-processing'
import {PaymentSuccess} from './payment-success'
import {ReceiptModal} from './receipt-modal'
import {tickerSymbol} from './ticker'
import type {Token} from './token-coaster'
import {Tokens} from './token-list'
import {PayTabProps} from './types'

const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {name: 'to', type: 'address'},
      {name: 'amount', type: 'uint256'},
    ],
    outputs: [{name: '', type: 'bool'}],
  },
] as const

const RECEIPT_RETRY_DELAY_MS = (attemptIndex: number) =>
  Math.min(1000 * 2 ** attemptIndex, 5000)
const RECEIPT_REFETCH_INTERVAL_MS = (query: {
  state: {data: unknown}
}): number | false => {
  if (query.state.data) return false
  return 2000
}

const getDisplayTokenSymbol = (
  token: Token | null,
  nativeSymbol: string,
): string => {
  if (token === 'ethereum') return nativeSymbol
  if (token === 'usdc' || token === 'usdt') return token
  return nativeSymbol
}

const STABLE_TOKEN_CONFIG: Record<
  Exclude<EvmPayToken, 'ethereum'>,
  {
    isSupportedChain: (chainId: number) => boolean
    getAddress: (chainId: number) => Address | undefined
  }
> = {
  usdc: {
    isSupportedChain: isUsdcSupportedChain,
    getAddress: getUsdcAddress,
  },
  usdt: {
    isSupportedChain: isUsdtSupportedChain,
    getAddress: getUsdtAddress,
  },
}

const toLocalReceipt = (
  txReceipt: {blockNumber: bigint; status: string} | null | undefined,
) => {
  if (!txReceipt) return null
  return {
    blockNumber: txReceipt.blockNumber,
    status:
      txReceipt.status === 'success'
        ? ('success' as const)
        : ('reverted' as const),
  }
}

export const PayTab = ({
  onPaymentSuccess,
  tokenPrice,
  disabled,
  defaultPaymentAmountUsd,
  isPending = false,
  isConfirming = false,
  receipt = null,
  hash = null,
  explorerUrl = null,
  onReset,
}: PayTabProps) => {
  const {params, setParams} = useSearchParams()

  // Selected token state - sync with search params
  const selectedTokenParam = params.tokenSelected
  const selectedToken = parseTokenParam(selectedTokenParam)
  const setSelectedToken = useCallback(
    (token: Token | null) => {
      void setParams({tokenSelected: token ?? null})
    },
    [setParams],
  )

  // Payment amount state (always in USD) - sync with search params
  const paymentAmountUsd =
    params.paymentAmountUsd ?? defaultPaymentAmountUsd ?? '0.00'
  const setPaymentAmountUsd = useCallback(
    (value: string | ((prev: string) => string)) => {
      const newValue =
        typeof value === 'function' ? value(paymentAmountUsd) : value
      void setParams({paymentAmountUsd: newValue || null})
    },
    [setParams, paymentAmountUsd],
  )

  // Token used for the last/in-flight payment (so we show correct symbol and use correct tx state)
  const [lastPaymentToken, setLastPaymentToken] = useState<Token | null>(null)
  const [lastPaymentChainId, setLastPaymentChainId] = useState<number | null>(
    null,
  )

  const chainId = useChainId()
  const chains = useChains()
  const {mutateAsync} = useSwitchChain()
  const {tokens: networkTokens, isLoading: tokensLoading} = useNetworkTokens()
  const [, startTransition] = useTransition()
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const {getBySymbol} = useCrypto()

  const currentChain = useMemo(
    () => chains.find((c) => c.id === chainId),
    [chains, chainId],
  )

  // Get native token price based on current network
  const nativeTokenPrice = useMemo(() => {
    const priceSymbol = getPriceSymbolForChainId(chainId)
    const quote = getBySymbol(priceSymbol)
    if (quote?.price) {
      return quote.price
    }
    return priceSymbol === 'ETH' ? tokenPrice : null
  }, [chainId, getBySymbol, tokenPrice])

  const bitcoinPrice = useMemo(
    () => getBySymbol('BTC')?.price ?? null,
    [getBySymbol],
  )

  // Get token price for displayed token amounts.
  const getTokenPrice = useCallback(
    (token: Token | null): number | null => {
      if (!token) return null
      if (token === 'usdc' || token === 'usdt') return 1 // USDC and USDT are always $1
      if (token === 'ethereum') return nativeTokenPrice // This handles ETH, MATIC, etc. based on network
      if (token === 'matic') return nativeTokenPrice
      if (token === 'bitcoin') return bitcoinPrice
      return null
    },
    [nativeTokenPrice, bitcoinPrice],
  )

  // Base USD value entered by the user before fees
  const baseUsdValue = useMemo(() => {
    if (!paymentAmountUsd) return null
    const parsedAmount = Number.parseFloat(paymentAmountUsd)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return null
    return parsedAmount
  }, [paymentAmountUsd])

  // Amount actually charged to the payer (base + 6.75% fee)
  const payableUsdValue = useMemo(() => {
    if (baseUsdValue === null) return null
    return withSecureRetry(baseUsdValue)
  }, [baseUsdValue])

  // Calculate token amount from payable USD amount
  const tokenAmount = useMemo(() => {
    if (!selectedToken || payableUsdValue === null) return null
    const price = getTokenPrice(selectedToken)
    if (!price) return null
    return payableUsdValue / price
  }, [selectedToken, payableUsdValue, getTokenPrice])

  // Get current network name from chainId
  const currentNetwork = useMemo(() => getNetworkForChainId(chainId), [chainId])

  // Sync network to search params when chainId changes
  useEffect(() => {
    if (currentNetwork && params.network !== currentNetwork) {
      void setParams({network: currentNetwork})
    }
  }, [currentNetwork, params.network, setParams])

  // Handle network selection
  const handleNetworkSelect = useCallback(
    (network: string) => () => {
      const targetChainId = getChainIdForNetwork(network)
      if (targetChainId && targetChainId !== chainId) {
        startTransition(() => {
          void setParams({network})
          mutateAsync({chainId: targetChainId})
        })
      }
    },
    [chainId, mutateAsync, startTransition, setParams],
  )

  // Extract token list from network tokens
  const availableTokens = useMemo<Token[]>(() => {
    return networkTokens.map((t) => t.token)
  }, [networkTokens])

  // Get selected token balance
  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken) return null
    return networkTokens.find((t) => t.token === selectedToken) ?? null
  }, [selectedToken, networkTokens])

  // Check if selected token has insufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!selectedTokenBalance || !tokenAmount) return false
    const balance = Number.parseFloat(selectedTokenBalance.formatted)
    return tokenAmount > balance
  }, [selectedTokenBalance, tokenAmount])

  // Handle token selection
  const handleTokenSelect = useCallback(
    (token: Token) => {
      setSelectedToken(token)
    },
    [setSelectedToken],
  )

  // Formatted token amount for processing state (selected token)
  const processingTokenAmountFormatted = useMemo(() => {
    if (tokenAmount == null) return ''
    return tokenAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: getTokenFractionDigits(selectedToken),
    })
  }, [tokenAmount, selectedToken])

  // For success/receipt: use lastPaymentToken and USD-based token amount
  const successTokenAmountFormatted = useMemo(() => {
    const tok = lastPaymentToken
    if (!tok || payableUsdValue === null) return ''
    const price = getTokenPrice(tok)
    if (!price) return ''
    const amt = payableUsdValue / price
    return amt.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: getTokenFractionDigits(tok),
    })
  }, [lastPaymentToken, payableUsdValue, getTokenPrice])

  const nativeSymbol = getNativeSymbolForChainId(chainId)
  const displayTokenSymbol = (t: Token | null) =>
    getDisplayTokenSymbol(t, nativeSymbol)

  // Get payment destination from environment variable
  const dtest = useMemo(() => {
    const dest = process.env.NEXT_PUBLIC_D_TEST
    if (!dest) {
      console.warn('NEXT_PUBLIC_D_TEST is not set')
      return null
    }
    return dest as Address
  }, [])

  // EIP-681 payment request URI for wallet QR scan (ethereum:...)
  const paymentRequestUri = useMemo(() => {
    if (!dtest || !selectedToken || !chainId) return null
    if (selectedToken === 'ethereum') {
      if (tokenAmount == null || tokenAmount <= 0) return null
      const value = `${Number(tokenAmount)}e18`
      return `ethereum:${dtest}@${chainId}?value=${value}`
    }

    if (selectedToken === 'usdc' || selectedToken === 'usdt') {
      const tokenConfig = STABLE_TOKEN_CONFIG[selectedToken]
      if (!tokenConfig.isSupportedChain(chainId) || payableUsdValue === null) {
        return null
      }

      const tokenAddress = tokenConfig.getAddress(chainId)
      if (!tokenAddress) return null

      const amount = `${payableUsdValue.toFixed(6)}e6`
      return `ethereum:${tokenAddress}@${chainId}/transfer?address=${dtest}&uint256=${amount}`
    }

    return null
  }, [dtest, selectedToken, chainId, tokenAmount, payableUsdValue])

  // Hook for sending transactions
  const {
    send: sendEth,
    isPending: isEthPending,
    isConfirming: isEthConfirming,
    hash: ethHash,
    receipt: ethReceipt,
  } = useSend()

  // Hook for writing contracts (USDC and USDT transfers)
  const {mutate, data: usdcHash, isPending: isUsdcPending} = useWriteContract()
  const {
    mutate: mutateUsdt,
    data: usdtHash,
    isPending: isUsdtPending,
  } = useWriteContract()

  // Wait for USDC transaction receipt
  const {isLoading: isUsdcConfirming, data: usdcReceipt} =
    useWaitForTransactionReceipt({
      hash: usdcHash,
      query: {
        enabled: !!usdcHash,
        retry: 5,
        retryDelay: RECEIPT_RETRY_DELAY_MS,
        refetchInterval: RECEIPT_REFETCH_INTERVAL_MS,
      },
    })

  // Wait for USDT transaction receipt
  const {isLoading: isUsdtConfirming, data: usdtReceipt} =
    useWaitForTransactionReceipt({
      hash: usdtHash,
      query: {
        enabled: !!usdtHash,
        retry: 5,
        retryDelay: RECEIPT_RETRY_DELAY_MS,
        refetchInterval: RECEIPT_REFETCH_INTERVAL_MS,
      },
    })

  // Use lastPaymentToken to resolve tx state (token we actually paid with), fallback to selectedToken
  const tokenForTxState = lastPaymentToken ?? selectedToken

  const localTxStateByToken = useMemo(
    () => ({
      ethereum: {
        isPending: isEthPending,
        isConfirming: isEthConfirming,
        hash: ethHash,
        receipt: toLocalReceipt(ethReceipt),
      },
      usdc: {
        isPending: isUsdcPending,
        isConfirming: isUsdcConfirming,
        hash: usdcHash,
        receipt: toLocalReceipt(usdcReceipt),
      },
      usdt: {
        isPending: isUsdtPending,
        isConfirming: isUsdtConfirming,
        hash: usdtHash,
        receipt: toLocalReceipt(usdtReceipt),
      },
    }),
    [
      isEthPending,
      isEthConfirming,
      ethHash,
      ethReceipt,
      isUsdcPending,
      isUsdcConfirming,
      usdcHash,
      usdcReceipt,
      isUsdtPending,
      isUsdtConfirming,
      usdtHash,
      usdtReceipt,
    ],
  )

  const localTxState =
    tokenForTxState && isEvmPayToken(tokenForTxState)
      ? localTxStateByToken[tokenForTxState]
      : null

  // Use local transaction state if we have an active transaction, otherwise use props
  const localIsPending = localTxState?.isPending ?? false
  const localIsConfirming = localTxState?.isConfirming ?? false
  const localHash = localTxState?.hash ?? null
  const localReceipt = localTxState?.receipt ?? null

  const activeIsPending = localIsPending || isPending
  const activeIsConfirming = localIsConfirming || isConfirming
  const activeHash = localHash || hash
  const activeReceipt = localReceipt || receipt
  const reportedSuccessHashRef = useRef<`0x${string}` | null>(null)
  const relayedPaymentHashRef = useRef<`0x${string}` | null>(null)

  useEffect(() => {
    if (
      !onPaymentSuccess ||
      !activeHash ||
      !activeReceipt ||
      activeReceipt.status !== 'success'
    ) {
      return
    }

    if (reportedSuccessHashRef.current === activeHash) {
      return
    }

    reportedSuccessHashRef.current = activeHash
    void onPaymentSuccess(activeHash)
  }, [activeHash, activeReceipt, onPaymentSuccess])

  useEffect(() => {
    if (!activeHash || !activeReceipt || activeReceipt.status !== 'success') {
      return
    }

    if (!tokenForTxState || !isEvmPayToken(tokenForTxState)) {
      return
    }

    const relayToken = tokenForTxState
    const relayChainId = lastPaymentChainId ?? chainId
    if (!relayToken || !relayChainId) {
      return
    }

    if (relayedPaymentHashRef.current === activeHash) {
      return
    }

    relayedPaymentHashRef.current = activeHash

    void (async () => {
      try {
        const response = await fetch('/api/relay', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            paymentHash: activeHash,
            chainId: relayChainId,
            token: relayToken,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error ?? 'Relay request failed')
        }

        if (process.env.NODE_ENV === 'development') {
          const payload = await response.json().catch(() => null)
          console.log('Relay completed:', payload)
        }
      } catch (relayError) {
        relayedPaymentHashRef.current = null
        console.error('Relay forwarding failed:', relayError)
      }
    })()
  }, [activeHash, activeReceipt, tokenForTxState, lastPaymentChainId, chainId])

  const receiptExplorerUrl = useMemo(
    () => getTransactionExplorerUrl(currentChain, activeHash) ?? explorerUrl,
    [currentChain, activeHash, explorerUrl],
  )

  const isUnsupportedPaymentToken =
    selectedToken !== null && !isEvmPayToken(selectedToken)

  const isBasePayDisabled = usePayButtonState({
    disabled,
    activeIsConfirming,
    activeIsPending,
    hasInsufficientBalance,
    selectedToken,
    paymentAmountUsd,
    dtest,
    localIsPending,
    localIsConfirming,
    isPendingProp: isPending,
    isConfirmingProp: isConfirming,
  })
  const isPayDisabled = isBasePayDisabled || isUnsupportedPaymentToken

  const sendStableTokenPayment = useCallback(
    (token: Exclude<EvmPayToken, 'ethereum'>, usdAmount: number) => {
      if (!dtest) return

      const tokenConfig = STABLE_TOKEN_CONFIG[token]
      if (!tokenConfig.isSupportedChain(chainId)) {
        throw new Error(`${token.toUpperCase()} is not supported on this chain`)
      }

      const tokenAddress = tokenConfig.getAddress(chainId)
      if (!tokenAddress) {
        throw new Error(
          `${token.toUpperCase()} address not found for this chain`,
        )
      }

      const transferAmount = parseUnits(usdAmount.toFixed(6), 6)
      const writer = token === 'usdc' ? mutate : mutateUsdt
      writer({
        abi: ERC20_TRANSFER_ABI,
        address: tokenAddress,
        functionName: 'transfer',
        args: [dtest, transferAmount],
      })
    },
    [chainId, dtest, mutate, mutateUsdt],
  )

  // Handle payment
  const handlePay = useCallback(() => {
    if (
      !selectedToken ||
      !paymentAmountUsd ||
      !dtest ||
      hasInsufficientBalance
    ) {
      return
    }

    if (payableUsdValue === null) {
      return
    }

    setLastPaymentToken(selectedToken)
    setLastPaymentChainId(chainId)

    try {
      switch (selectedToken) {
        case 'ethereum':
          sendEth({to: dtest, usd: payableUsdValue, chainId})
          return
        case 'usdc':
        case 'usdt':
          sendStableTokenPayment(selectedToken, payableUsdValue)
          return
        default:
          console.warn('Selected token is not supported yet for payments', {
            token: selectedToken,
          })
      }
    } catch (error) {
      console.error('Payment error:', error)
      // Error will be handled by the hooks
    }
  }, [
    selectedToken,
    paymentAmountUsd,
    payableUsdValue,
    dtest,
    hasInsufficientBalance,
    chainId,
    sendEth,
    sendStableTokenPayment,
  ])

  const spinRandomAmount = useCallback(() => {
    // range only from 1 to 12
    const randomAmount = Math.abs(Math.random() * 120)
    setPaymentAmountUsd(
      randomAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'never',
      }),
    )
  }, [setPaymentAmountUsd])

  const payButtonTokenLabel = selectedToken
    ? tickerSymbol(displayTokenSymbol(selectedToken))
    : null
  const payButtonLabel = payButtonTokenLabel
    ? `Pay with ${payButtonTokenLabel}`
    : 'Pay'
  const enablePayHoverStyles =
    !disabled &&
    !activeIsConfirming &&
    !activeIsPending &&
    !hasInsufficientBalance &&
    !isUnsupportedPaymentToken &&
    !!selectedToken &&
    !!paymentAmountUsd &&
    !!dtest

  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{layout: {duration: 0.3, ease: 'easeInOut'}}}
      className='space-y-0 w-full p-1 md:p-4 pb-10 md:h-150 rounded-lg border-2 border-white/20 flex flex-col'>
      <div>
        {paymentAmountUsd && payableUsdValue !== null && !activeReceipt && (
          <PayAmount
            spinRandomAmount={spinRandomAmount}
            usdValue={payableUsdValue}
            paymentRequestUri={paymentRequestUri}
            recipient={dtest}
            tokenAmountFormatted={processingTokenAmountFormatted}
            symbol={displayTokenSymbol(selectedToken)}
          />
        )}
        {selectedToken && (
          <AmountPayInput
            selectedTokenBalance={selectedTokenBalance}
            tokenAmount={tokenAmount}
            selectedToken={selectedToken}
            paymentAmountUsd={paymentAmountUsd}
            setPaymentAmountUsd={setPaymentAmountUsd}
            getTokenPrice={getTokenPrice}
          />
        )}
        <NetworkSelector
          currentNetwork={currentNetwork}
          onSelectNetwork={handleNetworkSelect}
        />
        <motion.div
          initial={{opacity: 0, y: 5}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -10}}
          transition={{layout: {duration: 0.3, ease: 'easeInOut'}}}
          className='space-y-6 md:px-4 transition-transform duration-200'>
          <motion.div
            layout
            transition={{duration: 0.3, ease: 'easeInOut'}}
            className={cn('overflow-y-auto', {
              'h-28': availableTokens.length <= 1,
              'h-56': availableTokens.length > 1,
            })}>
            {tokensLoading ? (
              <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.5}}
                className='flex items-center justify-center h-24'>
                <Icon name='spinners-ring' className='w-6 h-6 text-white/40' />
              </motion.div>
            ) : availableTokens.length > 0 ? (
              <Tokens
                tokens={availableTokens}
                tokenBalances={networkTokens}
                selectedToken={selectedToken}
                paymentAmountUsd={paymentAmountUsd}
                tokenPrices={{usdc: 1, usdt: 1, ethereum: nativeTokenPrice}}
                nativeSymbol={nativeSymbol}
                listHeightClassName='h-56'
                onTokenSelect={handleTokenSelect}
              />
            ) : (
              <div className='relative h-28 overflow-hidden flex items-center justify-center text-white/60 text-sm'>
                <motion.div className='space-y-3 sm:space-y-4 opacity-60 bg-blend-lighten blur-3xl w-full h-full absolute -top-1 right-0 bg-top-right' />
                <p className=' line-clamp-2 max-w-[18ch] text-center font-okxs'>
                  No tokens with balance found on this network
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Processing / Success State */}
        <AnimatePresence mode='wait'>
          <motion.div layout className='mt-0'>
            {activeReceipt && activeReceipt.status === 'success' ? (
              <PaymentSuccess
                key='success'
                tokenAmount={successTokenAmountFormatted}
                tokenSymbol={displayTokenSymbol(lastPaymentToken)}
                usdValue={payableUsdValue}
                hash={activeHash || null}
                explorerUrl={receiptExplorerUrl}
              />
            ) : activeIsPending || activeIsConfirming ? (
              <PaymentProcessing
                key='sending'
                tokenAmount={processingTokenAmountFormatted}
                tokenSymbol={displayTokenSymbol(selectedToken)}
                usdValue={payableUsdValue}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className='mt-auto pb-4'>
        <PayButtons
          showReceiptButton={
            !!activeReceipt && activeReceipt.status === 'success' && !!onReset
          }
          onViewReceipt={() => setShowReceiptModal(true)}
          onPay={handlePay}
          isPayDisabled={isPayDisabled}
          isPayProcessing={activeIsPending || activeIsConfirming}
          payLabel={payButtonLabel}
          enablePayHoverStyles={enablePayHoverStyles}
        />
      </div>
      <ReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        amount={successTokenAmountFormatted}
        symbol={displayTokenSymbol(lastPaymentToken)}
        usdValue={payableUsdValue}
        hash={activeHash ?? null}
        explorerUrl={receiptExplorerUrl}
        recipient={null}
        blockNumber={activeReceipt?.blockNumber}
        timestamp={new Date().toISOString()}
      />
    </motion.div>
  )
}
