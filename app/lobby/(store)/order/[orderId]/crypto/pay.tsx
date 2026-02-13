'use client'

import {PayTab} from '@/components/appkit/pay'
import {
  SearchParamsProvider,
  useSearchParams,
} from '@/components/sepolia/search-params-context'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCrypto} from '@/hooks/use-crypto'
import {useMutation, useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useCallback, useMemo, useRef, useState} from 'react'

const CryptoPayContent = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})
  const updatePayment = useMutation(api.orders.m.updatePayment)
  const {setParams} = useSearchParams()
  const {getBySymbol} = useCrypto()
  const [, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const paymentSyncedTxHashRef = useRef<`0x${string}` | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const ethPrice = useMemo(
    () => getBySymbol('ETH')?.price ?? null,
    [getBySymbol],
  )

  const defaultPaymentAmountUsd = useMemo(() => {
    if (order == null || order === undefined) return undefined
    return (order.totalCents / 100).toFixed(2)
  }, [order])

  const handleReset = useCallback(() => {
    setTo('')
    setAmount('')
    void setParams({
      tokenSelected: null,
      paymentAmountUsd: null,
      to: null,
      amount: null,
    })
  }, [setParams])

  const handlePaymentSuccess = useCallback(
    async (transactionHash: `0x${string}`) => {
      if (!order || order.payment.status === 'completed') return
      if (paymentSyncedTxHashRef.current === transactionHash) return

      paymentSyncedTxHashRef.current = transactionHash
      try {
        await updatePayment({
          orderId,
          payment: {
            ...order.payment,
            status: 'completed',
            transactionId: transactionHash,
            paidAt: Date.now(),
          },
        })
      } catch (error) {
        paymentSyncedTxHashRef.current = null
        console.error('Failed to update order payment status:', error)
      }
    },
    [order, orderId, updatePayment],
  )

  return (
    <div className='relative w-3xl max-w-3xl mx-auto flex h-full'>
      <div className='w-full relative bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-950 md:border-[0.33px] border-white/10 overflow-hidden shadow-2xl pb-12'>
        <PayTab
          onSend={() => undefined}
          onPaymentSuccess={handlePaymentSuccess}
          addressInputRef={addressInputRef}
          amountInputRef={amountInputRef}
          disabled={false}
          setTo={setTo}
          setAmount={setAmount}
          amount={amount}
          formattedBalance={null}
          balance={null}
          tokenPrice={ethPrice}
          defaultPaymentAmountUsd={defaultPaymentAmountUsd}
          onReset={handleReset}
        />
      </div>
    </div>
  )
}

export const CryptoPay = () => {
  return (
    <SearchParamsProvider>
      <CryptoPayContent />
    </SearchParamsProvider>
  )
}
