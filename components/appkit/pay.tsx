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
import {mainnet, polygon, polygonAmoy, sepolia} from '@reown/appkit/networks'
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
import {NetworkSelector} from './network-selector'
import {PayAmount} from './pay-amount'
import {PaymentProcessing} from './payment-processing'
import {PaymentSuccess} from './payment-success'
import {ReceiptModal} from './receipt-modal'
import type {Token} from './token-coaster'
import {Tokens} from './token-list'
import {PayTabProps} from './types'

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
  const selectedToken: Token | null =
    selectedTokenParam === 'usdc' ||
    selectedTokenParam === 'ethereum' ||
    selectedTokenParam === 'usdt'
      ? selectedTokenParam
      : null
  const setSelectedToken = useCallback(
    (token: Token | null) => {
      void setParams({tokenSelected: token ?? null})
    },
    [setParams],
  )

  // Payment amount state (always in USD) - sync with search params
  const paymentAmountUsd =
    params.paymentAmountUsd ?? defaultPaymentAmountUsd ?? '0.25'
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
    // For Polygon and Amoy, use MATIC price; for Ethereum/Sepolia, use ETH price
    const isPolygonNetwork =
      chainId === polygon.id || chainId === polygonAmoy.id
    const symbol = isPolygonNetwork ? 'POL' : 'ETH'
    const quote = getBySymbol(symbol)
    return quote?.price ?? (isPolygonNetwork ? null : tokenPrice) // Fallback to tokenPrice prop for ETH networks
  }, [chainId, getBySymbol, tokenPrice])

  // Get token price (USDC = $1, USDT = $1, native token = nativeTokenPrice)
  const getTokenPrice = useCallback(
    (token: Token | null): number | null => {
      if (!token) return null
      if (token === 'usdc' || token === 'usdt') return 1 // USDC and USDT are always $1
      if (token === 'ethereum') return nativeTokenPrice // This handles ETH, MATIC, etc. based on network
      return null
    },
    [nativeTokenPrice],
  )

  // Calculate token amount from USD amount
  const tokenAmount = useMemo(() => {
    if (!selectedToken || !paymentAmountUsd) return null
    const usdAmount = Number.parseFloat(paymentAmountUsd)
    if (Number.isNaN(usdAmount) || usdAmount <= 0) return null
    const price = getTokenPrice(selectedToken)
    if (!price) return null
    return usdAmount / price
  }, [selectedToken, paymentAmountUsd, getTokenPrice])

  // USD value is the payment amount itself (since it's already in USD)
  const usdValue = useMemo(() => {
    if (!paymentAmountUsd) return null
    const parsedAmount = Number.parseFloat(paymentAmountUsd)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return null
    return parsedAmount
  }, [paymentAmountUsd])

  // Map network names to chain IDs
  const networkChainMap: Record<string, number> = useMemo(
    () => ({
      sepolia: sepolia.id,
      ethereum: mainnet.id,
      polygon: polygon.id,
      amoy: polygonAmoy.id,
      // bitcoin is not an EVM chain, so we'll skip it for now
    }),
    [],
  )

  // Get current network name from chainId
  const currentNetwork = useMemo(() => {
    if (chainId === sepolia.id) return 'sepolia'
    if (chainId === mainnet.id) return 'ethereum'
    if (chainId === polygon.id) return 'polygon'
    if (chainId === polygonAmoy.id) return 'amoy'
    return null
  }, [chainId])

  // Sync network to search params when chainId changes
  useEffect(() => {
    if (currentNetwork && params.network !== currentNetwork) {
      void setParams({network: currentNetwork})
    }
  }, [currentNetwork, params.network, setParams])

  // Handle network selection
  const handleNetworkSelect = useCallback(
    (network: string) => () => {
      const targetChainId = networkChainMap[network]
      if (targetChainId && targetChainId !== chainId) {
        startTransition(() => {
          void setParams({network})
          mutateAsync({chainId: targetChainId})
        })
      }
    },
    [chainId, mutateAsync, startTransition, networkChainMap, setParams],
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
      maximumFractionDigits:
        selectedToken === 'usdc' || selectedToken === 'usdt' ? 6 : 8,
    })
  }, [tokenAmount, selectedToken])

  // For success/receipt: use lastPaymentToken and USD-based token amount
  const successTokenAmountFormatted = useMemo(() => {
    const tok = lastPaymentToken
    if (!tok || !usdValue) return ''
    const price = getTokenPrice(tok)
    if (!price) return ''
    const amt = usdValue / price
    return amt.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: tok === 'usdc' || tok === 'usdt' ? 6 : 8,
    })
  }, [lastPaymentToken, usdValue, getTokenPrice])

  const nativeSymbol =
    chainId === polygon.id || chainId === polygonAmoy.id ? 'matic' : 'ethereum'
  const displayTokenSymbol = (t: Token | null) =>
    t === 'usdc' ? 'usdc' : t === 'ethereum' ? nativeSymbol : 'matic'

  // Get payment destination from environment variable
  const paymentDestination = useMemo(() => {
    const dest = process.env.NEXT_PUBLIC_PAYMENT_DESTINATION_ONE
    if (!dest) {
      console.warn('NEXT_PUBLIC_PAYMENT_DESTINATION_ONE is not set')
      return null
    }
    return dest as Address
  }, [])

  // EIP-681 payment request URI for wallet QR scan (ethereum:...)
  const paymentRequestUri = useMemo(() => {
    if (!paymentDestination || !selectedToken || !chainId) return null
    if (selectedToken === 'ethereum') {
      if (tokenAmount == null || tokenAmount <= 0) return null
      // Native ETH: ethereum:0x...@chainId?value=0.5e18
      const value = `${Number(tokenAmount)}e18`
      return `ethereum:${paymentDestination}@${chainId}?value=${value}`
    }
    if (selectedToken === 'usdc') {
      if (!isUsdcSupportedChain(chainId)) return null
      const usdcAddress = getUsdcAddress(chainId)
      if (!usdcAddress || !paymentAmountUsd) return null
      const usd = Number.parseFloat(paymentAmountUsd)
      if (Number.isNaN(usd) || usd <= 0) return null
      // ERC20 transfer: ethereum:token@chainId/transfer?address=0x...&uint256=1.5e6
      const amount = `${usd.toFixed(6)}e6`
      return `ethereum:${usdcAddress}@${chainId}/transfer?address=${paymentDestination}&uint256=${amount}`
    }
    if (selectedToken === 'usdt') {
      if (!isUsdtSupportedChain(chainId)) return null
      const usdtAddress = getUsdtAddress(chainId)
      if (!usdtAddress || !paymentAmountUsd) return null
      const usd = Number.parseFloat(paymentAmountUsd)
      if (Number.isNaN(usd) || usd <= 0) return null
      // ERC20 transfer: ethereum:token@chainId/transfer?address=0x...&uint256=1.5e6
      // USDT uses 6 decimals
      const amount = `${usd.toFixed(6)}e6`
      return `ethereum:${usdtAddress}@${chainId}/transfer?address=${paymentDestination}&uint256=${amount}`
    }
    return null
  }, [
    paymentDestination,
    selectedToken,
    chainId,
    tokenAmount,
    paymentAmountUsd,
  ])

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
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        refetchInterval: (query) => {
          if (query.state.data) return false
          return 2000
        },
      },
    })

  // Wait for USDT transaction receipt
  const {isLoading: isUsdtConfirming, data: usdtReceipt} =
    useWaitForTransactionReceipt({
      hash: usdtHash,
      query: {
        enabled: !!usdtHash,
        retry: 5,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        refetchInterval: (query) => {
          if (query.state.data) return false
          return 2000
        },
      },
    })

  // Use lastPaymentToken to resolve tx state (token we actually paid with), fallback to selectedToken
  const tokenForTxState = lastPaymentToken ?? selectedToken

  // Determine which transaction state to use (use local state if available, otherwise use props)
  const localIsPending =
    tokenForTxState === 'ethereum'
      ? isEthPending
      : tokenForTxState === 'usdt'
        ? isUsdtPending
        : isUsdcPending
  const localIsConfirming =
    tokenForTxState === 'ethereum'
      ? isEthConfirming
      : tokenForTxState === 'usdt'
        ? isUsdtConfirming
        : isUsdcConfirming
  const localHash =
    tokenForTxState === 'ethereum'
      ? ethHash
      : tokenForTxState === 'usdt'
        ? usdtHash
        : usdcHash
  const localReceipt =
    tokenForTxState === 'ethereum'
      ? ethReceipt
        ? {
            blockNumber: ethReceipt.blockNumber,
            status:
              ethReceipt.status === 'success'
                ? ('success' as const)
                : ('reverted' as const),
          }
        : null
      : tokenForTxState === 'usdt'
        ? usdtReceipt
          ? {
              blockNumber: usdtReceipt.blockNumber,
              status:
                usdtReceipt.status === 'success'
                  ? ('success' as const)
                  : ('reverted' as const),
            }
          : null
        : usdcReceipt
          ? {
              blockNumber: usdcReceipt.blockNumber,
              status:
                usdcReceipt.status === 'success'
                  ? ('success' as const)
                  : ('reverted' as const),
            }
          : null

  // Use local transaction state if we have an active transaction, otherwise use props
  const activeIsPending = localIsPending || isPending
  const activeIsConfirming = localIsConfirming || isConfirming
  const activeHash = localHash || hash
  const activeReceipt = localReceipt || receipt
  const reportedSuccessHashRef = useRef<`0x${string}` | null>(null)

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

  const receiptExplorerUrl = useMemo(
    () => getTransactionExplorerUrl(currentChain, activeHash) ?? explorerUrl,
    [currentChain, activeHash, explorerUrl],
  )

  const isPayDisabled = usePayButtonState({
    disabled,
    activeIsConfirming,
    activeIsPending,
    hasInsufficientBalance,
    selectedToken,
    paymentAmountUsd,
    paymentDestination,
    localIsPending,
    localIsConfirming,
    isPendingProp: isPending,
    isConfirmingProp: isConfirming,
  })

  // Handle payment
  const handlePay = useCallback(() => {
    if (
      !selectedToken ||
      !paymentAmountUsd ||
      !paymentDestination ||
      hasInsufficientBalance
    ) {
      return
    }

    const usdAmount = Number.parseFloat(paymentAmountUsd)
    if (Number.isNaN(usdAmount) || usdAmount <= 0) {
      return
    }

    setLastPaymentToken(selectedToken)

    try {
      if (selectedToken === 'ethereum') {
        // Send ETH using the existing send function
        sendEth({to: paymentDestination, usd: usdAmount})
      } else if (selectedToken === 'usdc') {
        // Send USDC using writeContract
        if (!isUsdcSupportedChain(chainId)) {
          throw new Error('USDC is not supported on this chain')
        }

        const usdcAddress = getUsdcAddress(chainId)
        if (!usdcAddress) {
          throw new Error('USDC address not found for this chain')
        }

        // USDC is $1, so USD amount = USDC amount
        // USDC uses 6 decimals
        const usdcAmount = parseUnits(usdAmount.toFixed(6), 6)

        // ERC20 transfer ABI
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

        mutate({
          abi: ERC20_TRANSFER_ABI,
          address: usdcAddress,
          functionName: 'transfer',
          args: [paymentDestination, usdcAmount],
        })
      } else if (selectedToken === 'usdt') {
        // Send USDT using writeContract
        if (!isUsdtSupportedChain(chainId)) {
          throw new Error('USDT is not supported on this chain')
        }

        const usdtAddress = getUsdtAddress(chainId)
        if (!usdtAddress) {
          throw new Error('USDT address not found for this chain')
        }

        // USDT is $1, so USD amount = USDT amount
        // USDT uses 6 decimals
        const usdtAmount = parseUnits(usdAmount.toFixed(6), 6)

        // ERC20 transfer ABI
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

        mutateUsdt({
          abi: ERC20_TRANSFER_ABI,
          address: usdtAddress,
          functionName: 'transfer',
          args: [paymentDestination, usdtAmount],
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      // Error will be handled by the hooks
    }
  }, [
    selectedToken,
    paymentAmountUsd,
    paymentDestination,
    hasInsufficientBalance,
    chainId,
    sendEth,
    mutate,
    mutateUsdt,
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

  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      transition={{layout: {duration: 0.3, ease: 'easeInOut'}}}
      className='space-y-0 w-full'>
      {/* Amount Info */}
      {paymentAmountUsd && usdValue && !activeReceipt && (
        <PayAmount
          spinRandomAmount={spinRandomAmount}
          usdValue={usdValue}
          paymentRequestUri={paymentRequestUri}
          recipient={paymentDestination}
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
      {/* Token Selection */}
      <NetworkSelector
        currentNetwork={currentNetwork}
        onSelectNetwork={handleNetworkSelect}
      />
      <motion.div
        initial={{opacity: 0, y: 5}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: -10}}
        transition={{layout: {duration: 0.3, ease: 'easeInOut'}}}
        className='space-y-6 pb-0 transition-transform duration-200 '>
        <motion.div
          layout
          transition={{duration: 0.3, ease: 'easeInOut'}}
          className={cn('overflow-scroll', {
            'h-28': availableTokens.length <= 1,
            'h-44': availableTokens.length > 1,
          })}>
          {tokensLoading ? (
            <motion.div
              initial={{opacity: 0, y: -20}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.5}}
              className='flex items-center justify-center h-24'>
              {/*<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>*/}
              <Icon name='spinners-ring' className='w-6 h-6 text-white/40' />
              {/*</motion.div>*/}
            </motion.div>
          ) : availableTokens.length > 0 ? (
            <Tokens
              tokens={availableTokens}
              tokenBalances={networkTokens}
              selectedToken={selectedToken}
              paymentAmountUsd={paymentAmountUsd}
              tokenPrices={{usdc: 1, usdt: 1, ethereum: nativeTokenPrice}}
              nativeSymbol={nativeSymbol}
              onTokenSelect={handleTokenSelect}
            />
          ) : (
            <div className='relative h-28 overflow-hidden flex items-center justify-center text-white/60 text-sm'>
              {/*<div className='absolute bg-[url("/svg/noise.svg")] opacity-3 scale-100 pointer-events-none top-0 left-0 w-full h-full' />*/}
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
              usdValue={usdValue}
              hash={activeHash || null}
              explorerUrl={receiptExplorerUrl}
            />
          ) : activeIsPending || activeIsConfirming ? (
            <PaymentProcessing
              key='sending'
              tokenAmount={processingTokenAmountFormatted}
              tokenSymbol={displayTokenSymbol(selectedToken)}
              usdValue={usdValue}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <motion.div layout>
        {/* Send Button / Send Another Button */}
        <motion.div
          whileHover={{scale: isPayDisabled ? 1 : 1.02}}
          whileTap={{scale: 0.98}}
          className='mt-4 mx-4'>
          {activeReceipt && activeReceipt.status === 'success' && onReset ? (
            <button
              onClick={() => setShowReceiptModal(true)}
              className='flex items-center justify-center w-full mx-auto h-14 text-lg font-medium rounded-xl bg-linear-to-r from-slate-500 via-slate-400 to-cyan-100 hover:from-slate-500 hover:to-slate-100 text-white border-0 shadow-lg transition-all'>
              <span className='flex items-center font-exo font-semibold italic gap-2'>
                View Receipt
                <Icon name='receipt-fill' className='w-5 h-5' />
              </span>
            </button>
          ) : (
            <button
              onClick={handlePay}
              disabled={isPayDisabled}
              className={cn(
                'flex items-center justify-center w-full mx-auto h-14 text-lg font-semibold rounded-xl bg-linear-to-r from-slate-400 via-slate-400 to-rose-200 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                {
                  'hover:from-slate-200 hover:to-rose-100':
                    !disabled &&
                    !activeIsConfirming &&
                    !activeIsPending &&
                    !hasInsufficientBalance &&
                    selectedToken &&
                    paymentAmountUsd &&
                    paymentDestination,
                },
              )}>
              {activeIsPending || activeIsConfirming ? (
                <motion.div
                  animate={{x: [0, 16, 0]}}
                  transition={{duration: 0.5, repeat: Infinity}}>
                  <Icon name='cash-fast' className='w-5 h-5' />
                </motion.div>
              ) : (
                <span className='flex items-center text-white opacity-100 gap-2 font-exo font-bold italic drop-shadow-2xs'>
                  Pay
                  <Icon name='cash-fast' className='w-5 h-5' />
                </span>
              )}
            </button>
          )}
        </motion.div>
      </motion.div>
      <ReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        amount={successTokenAmountFormatted}
        symbol={displayTokenSymbol(lastPaymentToken)}
        usdValue={usdValue}
        hash={activeHash ?? null}
        explorerUrl={receiptExplorerUrl}
        recipient={null}
        blockNumber={activeReceipt?.blockNumber}
        timestamp={new Date().toISOString()}
      />
    </motion.div>
  )
}
