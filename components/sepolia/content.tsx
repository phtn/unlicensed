// 'use client'

// import { config } from '@/ctx/wagmi/config'
// import { useCopy } from '@/hooks/use-copy'
// import { useSend } from '@/hooks/x-use-send'
// import { Icon } from '@/lib/icons'
// import { cn } from '@/lib/utils'
// import { useAppKitAccount } from '@reown/appkit/react'
// import { getBalance } from '@wagmi/core'
// import { AnimatePresence, motion } from 'motion/react'
// import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
// import { formatUnits, isAddress } from 'viem'
// import { useChainId, useChains } from 'wagmi'

// export interface Balance {
//   value: bigint
//   symbol: string
//   decimals: number
// }

// const AMOUNT_PRESETS = [10, 25, 50, 100, 250, 500]

// export const Content = () => {
//   const { send, isConfirming, error, hash, receipt, ethPrice, usdToEth } = useSend()
//   const { address } = useAppKitAccount()
//   const { copy, isCopied } = useCopy({})
//   const [to, setTo] = useState('')
//   const [amount, setAmount] = useState('')
//   const [localError, setLocalError] = useState<string | null>(null)
//   const [showPreview, setShowPreview] = useState(false)
//   const [showSuccess, setShowSuccess] = useState(false)
//   const [isPending, startTransition] = useTransition()
//   const [balance, setBalance] = useState<{ value: bigint; symbol: string; decimals: number } | null>(null)
//   const [confirmationTimeout, setConfirmationTimeout] = useState(false)
//   const inputRef = useRef<HTMLInputElement>(null)
//   const amountInputRef = useRef<HTMLInputElement>(null)

//   const chainId = useChainId()
//   const chains = useChains()
//   const currentChain = useMemo(() => chains.find((chain) => chain.id === chainId), [chains, chainId])

//   // Get block explorer URL
//   const explorerUrl = useMemo(() => {
//     if (!hash || !currentChain?.blockExplorers?.default) return null
//     return `${currentChain.blockExplorers.default.url}/tx/${hash}`
//   }, [hash, currentChain])

//   // Validate address
//   const isValidAddress = useMemo(() => {
//     if (!to) return null
//     return isAddress(to)
//   }, [to])

//   // Calculate ETH equivalent
//   const ethEquivalent = useMemo(() => {
//     if (!amount || !ethPrice) return null
//     const usdAmount = Number.parseFloat(amount)
//     if (Number.isNaN(usdAmount) || usdAmount <= 0) return null
//     const ethString = usdToEth(usdAmount)
//     return ethString ? Number.parseFloat(ethString) : null
//   }, [amount, ethPrice, usdToEth])

//   // Validate form
//   const isFormValid = useMemo(() => {
//     return isValidAddress === true && amount && Number.parseFloat(amount) > 0
//   }, [isValidAddress, amount])

//   // Check if user has sufficient balance
//   const hasInsufficientBalance = useMemo(() => {
//     if (!balance || !ethEquivalent) return false
//     const balanceEth = Number.parseFloat(formatUnits(balance.value, balance.decimals))
//     return ethEquivalent > balanceEth
//   }, [balance, ethEquivalent])

//   // Format balance
//   const formattedBalance = useMemo(() => {
//     if (!balance) return null
//     return Number.parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)
//   }, [balance])

//   const handleSend = useCallback(() => {
//     setLocalError(null)

//     if (!isValidAddress) {
//       setLocalError('Please enter a valid Ethereum address')
//       return
//     }

//     const usdAmount = Number.parseFloat(amount)
//     if (Number.isNaN(usdAmount) || usdAmount <= 0) {
//       setLocalError('Please enter a valid amount greater than 0')
//       return
//     }

//     if (hasInsufficientBalance) {
//       setLocalError('Insufficient balance')
//       return
//     }

//     setShowPreview(true)
//   }, [amount, isValidAddress, hasInsufficientBalance])

//   const confirmSend = useCallback(() => {
//     const usdAmount = Number.parseFloat(amount)
//     try {
//       send({ to: to as `0x${string}`, usd: usdAmount })
//       setShowPreview(false)
//     } catch (err) {
//       setLocalError(err instanceof Error ? err.message : 'Failed to send transaction')
//       setShowPreview(false)
//     }
//   }, [send, to, amount])

//   const handlePresetAmount = useCallback((preset: number) => {
//     setAmount(preset.toString())
//     amountInputRef.current?.focus()
//   }, [])

//   const handleCopyAddress = useCallback(() => {
//     if (to) {
//       copy('address', to)
//     }
//   }, [to, copy])

//   const handleCopyHash = useCallback(() => {
//     if (hash) {
//       copy('hash', hash)
//     }
//   }, [hash, copy])

//   // Fetch balance when address or chainId changes
//   useEffect(() => {
//     let isMounted = true

//     if (address && chainId) {
//       getBalance(config, {
//         address: address as `0x${string}`,
//         chainId
//       })
//         .then((bal) => {
//           if (isMounted) {
//             startTransition(() => {
//               setBalance({
//                 value: bal.value,
//                 symbol: bal.symbol,
//                 decimals: bal.decimals
//               })
//             })
//           }
//         })
//         .catch((err) => {
//           console.error('Failed to fetch balance:', err)
//           if (isMounted) {
//             startTransition(() => {
//               setBalance(null)
//             })
//           }
//         })
//     } else {
//       if (isMounted) {
//         startTransition(() => {
//           setBalance(null)
//         })
//       }
//     }

//     return () => {
//       isMounted = false
//     }
//   }, [address, chainId, startTransition])

//   // Set timeout for confirmation - if RPC is slow, stop showing loading after 30 seconds
//   useEffect(() => {
//     if (hash && isConfirming) {
//       const timeout = setTimeout(() => {
//         startTransition(() => {
//           setConfirmationTimeout(true)
//         })
//       }, 30000) // 30 seconds timeout
//       return () => clearTimeout(timeout)
//     } else {
//       startTransition(() => setConfirmationTimeout(false))
//     }
//   }, [hash, isConfirming, startTransition])

//   // Show success animation when transaction is confirmed
//   useEffect(() => {
//     if (receipt && receipt.status === 'success') {
//       let isMounted = true
//       startTransition(() => {
//         if (isMounted) {
//           setShowSuccess(true)
//         }
//       })
//       const timer = setTimeout(() => {
//         if (isMounted) {
//           startTransition(() => {
//             setShowSuccess(false)
//           })
//         }
//       }, 3000)
//       return () => {
//         isMounted = false
//         clearTimeout(timer)
//       }
//     }
//   }, [receipt, startTransition])

//   const displayError = localError || error?.message

//   return (
//     <main className='min-h-screen flex items-center justify-center p-4 md:p-8'>
//       {/* Animated background gradient */}
//       <div className='fixed inset-0 -z-10 overflow-hidden'>
//         <div className='absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20' />
//         <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]' />
//       </div>

//       <div className='w-full max-w-2xl'>
//         <div className='w-full'>
//           <div className='relative w-full rounded-3xl border border-white/10 bg-white/80 backdrop-blur-2xl p-8 shadow-2xl dark:bg-zinc-900/80 dark:border-zinc-700/50'>
//             {/* Glowing border effect */}
//             <div className='absolute inset-0 rounded-3xl bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 transition-opacity duration-500 hover:opacity-100 -z-10 blur-xl' />

//             {/* Header */}
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5 }}
//               className='mb-8'>
//               <div className='flex items-center justify-between mb-2'>
//                 <h2 className='text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
//                   Send Transaction
//                 </h2>
//                 {currentChain && (
//                   <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700'>
//                     <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />{' '}
//                     <span className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>{currentChain.name}</span>
//                   </div>
//                 )}
//               </div>

//               {/* Balance Display */}
//               {address && balance && (
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   transition={{ delay: 0.2 }}
//                   className='flex items-center gap-3 p-4 rounded-2xl bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50'>
//                   <div className='p-2 rounded-xl bg-white/50 dark:bg-zinc-800/50'>
//                     <Icon name='bookmark-list' className='w-5 h-5 text-blue-600 dark:text-blue-400' />
//                   </div>
//                   <div className='flex-1'>
//                     <p className='text-xs text-zinc-600 dark:text-zinc-400 mb-1'>Your Balance</p>
//                     <p className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
//                       {formattedBalance} {balance.symbol}
//                     </p>
//                     {ethPrice && (
//                       <p className='text-xs text-zinc-500 dark:text-zinc-500'>
//                         ≈ $
//                         {(Number.parseFloat(formatUnits(balance.value, balance.decimals)) * ethPrice).toLocaleString(
//                           'en-US',
//                           {
//                             style: 'currency',
//                             currency: 'USD',
//                             maximumFractionDigits: 2
//                           }
//                         )}
//                       </p>
//                     )}
//                   </div>
//                 </motion.div>
//               )}

//               {/* ETH Price Display */}
//               {ethPrice && (
//                 <motion.div
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: 0.3 }}
//                   className='mt-4 flex items-center gap-2 text-sm'>
//                   <Icon name='chart-line' className='w-4 h-4 text-green-500' />
//                   <span className='text-zinc-600 dark:text-zinc-400'>
//                     ETH Price:{' '}
//                     <span className='font-semibold text-zinc-900 dark:text-zinc-100'>
//                       ${ethPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                     </span>
//                   </span>
//                 </motion.div>
//               )}
//             </motion.div>

//             <div className='space-y-6'>
//               {/* Recipient Address */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.1, duration: 0.5 }}>
//                 <label
//                   htmlFor='recipient'
//                   className='mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
//                   Recipient Address
//                 </label>
//                 <div className='relative'>
//                   <input
//                     ref={inputRef}
//                     id='recipient'
//                     type='text'
//                     value={to}
//                     onChange={(e) => {
//                       setTo(e.target.value)
//                       setLocalError(null)
//                     }}
//                     placeholder='0x...'
//                     className={cn(
//                       'w-full rounded-xl border-2 px-4 py-3.5 pr-12 text-sm font-mono transition-all duration-300',
//                       'bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm',
//                       'border-zinc-200 dark:border-zinc-700',
//                       'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
//                       'focus:outline-none focus:bg-white dark:focus:bg-zinc-800',
//                       isValidAddress === false && 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20',
//                       isValidAddress === true &&
//                         'border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-900/20',
//                       isPending && 'opacity-50 cursor-not-allowed'
//                     )}
//                     disabled={isPending}
//                   />
//                   {to && (
//                     <button
//                       onClick={handleCopyAddress}
//                       className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors'>
//                       <Icon
//                         name={isCopied ? 'check' : 'copy-01'}
//                         className={cn('w-4 h-4 transition-colors', isCopied ? 'text-green-500' : 'text-zinc-400')}
//                       />
//                     </button>
//                   )}
//                 </div>
//                 <AnimatePresence>
//                   {isValidAddress === false && (
//                     <motion.p
//                       initial={{ opacity: 0, y: -10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0 }}
//                       className='mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1'>
//                       <Icon name='alert-02' className='w-4 h-4' />
//                       Invalid Ethereum address
//                     </motion.p>
//                   )}
//                   {isValidAddress === true && (
//                     <motion.p
//                       initial={{ opacity: 0, y: -10 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0 }}
//                       className='mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1'>
//                       <Icon name='check' className='w-4 h-4' />
//                       Valid address
//                     </motion.p>
//                   )}
//                 </AnimatePresence>
//               </motion.div>

//               {/* Amount Input */}
//               <motion.div
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: 0.2, duration: 0.5 }}>
//                 <label htmlFor='amount' className='mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
//                   Amount (USD)
//                 </label>
//                 <div className='relative'>
//                   <div className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-semibold'>
//                     $
//                   </div>
//                   <input
//                     ref={amountInputRef}
//                     id='amount'
//                     type='number'
//                     step='0.01'
//                     min='0.01'
//                     value={amount}
//                     onChange={(e) => {
//                       setAmount(e.target.value)
//                       setLocalError(null)
//                     }}
//                     placeholder='0.00'
//                     className={cn(
//                       'w-full rounded-xl border-2 pl-8 pr-4 py-3.5 text-sm transition-all duration-300',
//                       'bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm',
//                       'border-zinc-200 dark:border-zinc-700',
//                       'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
//                       'focus:outline-none focus:bg-white dark:focus:bg-zinc-800',
//                       isPending && 'opacity-50 cursor-not-allowed'
//                     )}
//                     disabled={isPending}
//                   />
//                 </div>
//                 {ethEquivalent !== null && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className='mt-2 flex items-center gap-2'>
//                     <Icon name='energy' className='w-4 h-4 text-purple-500' />
//                     <p className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
//                       ≈ <span className='font-bold text-zinc-900 dark:text-zinc-100'>{ethEquivalent.toFixed(6)}</span>{' '}
//                       ETH
//                     </p>
//                   </motion.div>
//                 )}

//                 {/* Amount Presets */}
//                 <div className='mt-3 flex flex-wrap gap-2'>
//                   {AMOUNT_PRESETS.map((preset) => (
//                     <motion.button
//                       key={preset}
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       onClick={() => handlePresetAmount(preset)}
//                       disabled={isPending}
//                       className={cn(
//                         'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
//                         'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700',
//                         'border border-zinc-200 dark:border-zinc-700',
//                         'disabled:opacity-50 disabled:cursor-not-allowed'
//                       )}>
//                       ${preset}
//                     </motion.button>
//                   ))}
//                 </div>
//               </motion.div>

//               {/* Send Button */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.3, duration: 0.5 }}>
//                 <button
//                   onClick={handleSend}
//                   disabled={isPending || !isFormValid || hasInsufficientBalance}
//                   className={cn(
//                     'w-full rounded-xl px-6 py-4 text-base font-semibold text-white transition-all duration-300',
//                     'bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
//                     'shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60',
//                     'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
//                     'relative overflow-hidden group'
//                   )}>
//                   <span className='relative z-10 flex items-center justify-center gap-2'>
//                     {isPending ? (
//                       <>
//                         <Icon name='spinner-ring' className='w-5 h-5' />
//                         Sending Transaction...
//                       </>
//                     ) : (
//                       <>
//                         <Icon name='arrow-right-02' className='w-5 h-5' />
//                         Send Transaction
//                       </>
//                     )}
//                   </span>
//                   <motion.div
//                     className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0'
//                     animate={{
//                       x: ['-100%', '100%']
//                     }}
//                     transition={{
//                       duration: 2,
//                       repeat: Infinity,
//                       ease: 'linear'
//                     }}
//                   />
//                 </button>
//               </motion.div>

//               {/* Error Display */}
//               <AnimatePresence>
//                 {displayError && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10, scale: 0.95 }}
//                     animate={{ opacity: 1, y: 0, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                     className='rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 p-4'>
//                     <div className='flex items-start gap-3'>
//                       <Icon name='alert-02' className='w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5' />
//                       <div className='flex-1'>
//                         <p className='text-sm font-semibold text-red-900 dark:text-red-100 mb-1'>Error</p>
//                         <p className='text-sm text-red-700 dark:text-red-300'>{displayError}</p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Insufficient Balance Warning */}
//               <AnimatePresence>
//                 {hasInsufficientBalance && (
//                   <motion.div
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0 }}
//                     className='rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 p-4'>
//                     <div className='flex items-start gap-3'>
//                       <Icon name='alert-02' className='w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5' />
//                       <div className='flex-1'>
//                         <p className='text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1'>
//                           Insufficient Balance
//                         </p>
//                         <p className='text-sm text-yellow-700 dark:text-yellow-300'>
//                           You don&apos;t have enough {balance?.symbol ?? 'ETH'} to complete this transaction.
//                         </p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Pending State - Waiting for wallet confirmation */}
//               <AnimatePresence>
//                 {isPending && !hash && (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.95 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                     className='rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 p-4'>
//                     <div className='flex items-center gap-3'>
//                       <motion.div
//                         animate={{ rotate: 360 }}
//                         transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
//                         <Icon name='spinner-ring' className='w-5 h-5 text-blue-600 dark:text-blue-400' />
//                       </motion.div>
//                       <div className='flex-1'>
//                         <p className='text-sm font-semibold text-blue-900 dark:text-blue-100'>Transaction Pending</p>
//                         <p className='text-sm text-blue-700 dark:text-blue-300'>
//                           Waiting for confirmation in your wallet...
//                         </p>
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Confirming State - Waiting for on-chain confirmation */}
//               <AnimatePresence>
//                 {isConfirming && hash && !confirmationTimeout && (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.95 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                     className='rounded-xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 p-4'>
//                     <div className='flex items-center gap-3'>
//                       <motion.div
//                         animate={{ rotate: 360 }}
//                         transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
//                         <Icon name='spinner-ring' className='w-5 h-5 text-purple-600 dark:text-purple-400' />
//                       </motion.div>
//                       <div className='flex-1'>
//                         <p className='text-sm font-semibold text-purple-900 dark:text-purple-100'>
//                           Transaction Submitted
//                         </p>
//                         <p className='text-sm text-purple-700 dark:text-purple-300'>
//                           Waiting for on-chain confirmation...
//                         </p>
//                         {hash && (
//                           <p className='text-xs text-purple-600 dark:text-purple-400 font-mono mt-1'>
//                             {hash.slice(0, 10)}...{hash.slice(-8)}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Success State - Show when we have receipt OR when hash exists and not confirming */}
//               <AnimatePresence>
//                 {hash && (!isConfirming || confirmationTimeout) && (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
//                     animate={{ opacity: 1, scale: 1, y: 0 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                     className='rounded-xl bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 p-6'>
//                     <div className='flex items-start gap-3 mb-4'>
//                       <motion.div
//                         initial={{ scale: 0 }}
//                         animate={{ scale: 1 }}
//                         transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
//                         <div className='p-2 rounded-full bg-green-500'>
//                           <Icon name='check' className='w-6 h-6 text-white' />
//                         </div>
//                       </motion.div>
//                       <div className='flex-1'>
//                         <p className='text-base font-bold text-green-900 dark:text-green-100 mb-1'>
//                           Transaction {receipt?.status === 'success' ? 'Successful' : 'Submitted'}!
//                         </p>
//                         <p className='text-sm text-green-700 dark:text-green-300'>
//                           {receipt
//                             ? receipt.status === 'success'
//                               ? 'Your transaction has been confirmed on the blockchain.'
//                               : 'Your transaction was reverted on the blockchain.'
//                             : 'Your transaction has been submitted. Waiting for confirmation...'}
//                         </p>
//                         {receipt?.blockNumber && (
//                           <p className='text-xs text-green-600 dark:text-green-400 mt-1'>
//                             Block: {receipt.blockNumber.toString()}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     <div className='space-y-3'>
//                       <div className='p-3 rounded-lg bg-white/50 dark:bg-zinc-800/50 border border-green-200 dark:border-green-800'>
//                         <div className='flex items-center justify-between mb-2'>
//                           <span className='text-xs font-semibold text-zinc-600 dark:text-zinc-400'>
//                             Transaction Hash
//                           </span>
//                           <button
//                             onClick={handleCopyHash}
//                             className='p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors'>
//                             <Icon
//                               name={isCopied ? 'check' : 'copy-01'}
//                               className={cn('w-4 h-4 transition-colors', isCopied ? 'text-green-500' : 'text-zinc-400')}
//                             />
//                           </button>
//                         </div>
//                         <p className='text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all'>{hash}</p>
//                       </div>

//                       {explorerUrl && (
//                         <motion.a
//                           href={explorerUrl}
//                           target='_blank'
//                           rel='noopener noreferrer'
//                           whileHover={{ scale: 1.02 }}
//                           whileTap={{ scale: 0.98 }}
//                           className='flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/50'>
//                           <Icon name='square-arrow-up-right' className='w-4 h-4' />
//                           View on {currentChain?.blockExplorers?.default.name ?? 'Explorer'}
//                         </motion.a>
//                       )}
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Preview Modal */}
//       <AnimatePresence>
//         {showPreview && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
//             onClick={() => setShowPreview(false)}>
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className='w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-6 shadow-2xl'>
//               <h3 className='text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100'>Confirm Transaction</h3>
//               <div className='space-y-4 mb-6'>
//                 <div>
//                   <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>To</p>
//                   <p className='text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all'>{to}</p>
//                 </div>
//                 <div>
//                   <p className='text-sm text-zinc-600 dark:text-zinc-400 mb-1'>Amount</p>
//                   <p className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
//                     ${Number.parseFloat(amount).toFixed(2)} USD
//                   </p>
//                   {ethEquivalent && (
//                     <p className='text-sm text-zinc-500 dark:text-zinc-500'>≈ {ethEquivalent.toFixed(6)} ETH</p>
//                   )}
//                 </div>
//               </div>
//               <div className='flex gap-3'>
//                 <button
//                   onClick={() => setShowPreview(false)}
//                   className='flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'>
//                   Cancel
//                 </button>
//                 <button
//                   onClick={confirmSend}
//                   className='flex-1 px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all'>
//                   Confirm
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Success Animation */}
//       <AnimatePresence>
//         {showSuccess && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className='fixed inset-0 z-50 pointer-events-none flex items-center justify-center'>
//             <motion.div
//               initial={{ scale: 0 }}
//               animate={{ scale: [0, 1.2, 1] }}
//               exit={{ scale: 0 }}
//               transition={{ type: 'spring', stiffness: 200, damping: 15 }}
//               className='p-8 rounded-full bg-linear-to-r from-green-500 to-emerald-500 shadow-2xl'>
//               <Icon name='check' className='w-16 h-16 text-white' />
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </main>
//   )
// }
