'use client'

import {Confetti} from '@/components/magicui/confetti'
import {useCopy} from '@/hooks/use-copy'
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
  title?: string
}

export const CheckoutSuccess = ({
  orderNumber,
  transactionId,
  title,
}: CheckoutSuccessProps) => {
  const {copy, copied} = useCopy({timeout: 2000})
  return (
    <div className='relative w-full max-w-2xl px-4'>
      <Confetti options={CONFETTI_OPTIONS} className='fixed inset-0 z-10' />
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className='relative z-20 overflow-hidden border dark:border-brand/40 border-foreground/40 bg-brand/2 p-6 md:p-8'>
        <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
        <div className='relative'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-brand/15'>
              <Icon name='check' className='h-6 w-6 text-brand' />
            </div>
            <div>
              <p className='font-clash text-xl dark:text-white'>
                {title ?? 'Payment Successful'}
              </p>
              <p className='font-brk text-xs uppercase tracking-wide dark:text-emerald-100/75'>
                Order * {orderNumber.substring(5)}
              </p>
            </div>
          </div>

          <p className='pl-14 py-2 font-okxs text-sm dark:text-white/80'>
            Your crypto payment has been confirmed.
          </p>

          <div className='mt-6 flex items-end justify-between'>
            {transactionId ? (
              <p className='flex items-center mt-2 font-ios text-xs dark:text-white/60 break-all'>
                TX:{' '}
                {transactionId.substring(0, 10) +
                  '...' +
                  transactionId.substring(transactionId.length - 10)}
                <Icon
                  name={copied ? 'check' : 'copy'}
                  className='h-4 w-4 ml-2'
                  onClick={() => copy('tx', transactionId)}
                />
              </p>
            ) : null}
            <Button
              as={NextLink}
              radius='none'
              href={`/account/orders/${orderNumber}`}
              className='h-11 px-6 bg-brand text-white font-clash font-semibold tracking-wider'>
              View Order
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
