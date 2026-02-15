'use client'

import {Confetti} from '@/components/magicui/confetti'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {motion} from 'motion/react'
import NextLink from 'next/link'

const CONFETTI_OPTIONS = {
  particleCount: 220,
  spread: 360,
  startVelocity: 56,
  decay: 0.92,
  gravity: 0.82,
  scalar: 1.08,
  ticks: 340,
  origin: {x: 0.5, y: 0.7},
}

interface CheckoutSuccessProps {
  orderNumber: string
  transactionId?: string | null
}

export const CheckoutSuccess = ({
  orderNumber,
  transactionId,
}: CheckoutSuccessProps) => {
  return (
    <div className='relative w-full max-w-xl px-4'>
      <Confetti
        options={CONFETTI_OPTIONS}
        className='fixed inset-0 z-10'
      />
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className='relative z-20 overflow-hidden rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-6 md:p-8'>
        <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
        <div className='relative'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300/15 border border-emerald-200/30'>
              <Icon name='check' className='h-6 w-6 text-emerald-200' />
            </div>
            <div>
              <p className='font-polyn text-xl text-white'>Payment Successful</p>
              <p className='font-brk text-xs uppercase tracking-wide text-emerald-100/75'>
                Order {orderNumber}
              </p>
            </div>
          </div>

          <p className='font-okxs text-sm text-white/80'>
            Your crypto payment has been confirmed.
          </p>
          {transactionId ? (
            <p className='mt-2 font-brk text-xs text-white/60 break-all'>
              TX: {transactionId}
            </p>
          ) : null}

          <div className='mt-6'>
            <Button
              as={NextLink}
              href={`/lobby/account/orders/${orderNumber}`}
              className='h-11 rounded-lg bg-emerald-300 text-black font-polysans font-semibold'>
              View Order
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
