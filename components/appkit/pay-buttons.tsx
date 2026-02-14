'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {motion} from 'motion/react'

interface PayButtonsProps {
  showReceiptButton: boolean
  onViewReceipt: VoidFunction
  onPay: VoidFunction
  isPayDisabled: boolean
  isPayProcessing: boolean
  payLabel: string
  enablePayHoverStyles: boolean
}

export const PayButtons = ({
  showReceiptButton,
  onViewReceipt,
  onPay,
  isPayDisabled,
  isPayProcessing,
  payLabel,
  enablePayHoverStyles,
}: PayButtonsProps) => {
  return (
    <motion.div layout>
      <motion.div
        whileHover={{scale: isPayDisabled ? 1 : 1.02}}
        whileTap={{scale: 0.98}}
        className='mt-8 mx-4'>
        {showReceiptButton ? (
          <button
            onClick={onViewReceipt}
            className='hidden _flex items-center justify-center w-full mx-auto h-14 text-lg font-medium rounded-xl bg-linear-to-r from-slate-500 via-slate-400 to-cyan-100 hover:from-slate-500 hover:to-slate-100 text-white border-0 shadow-lg transition-all'>
            <span className='flex items-center font-exo font-semibold italic gap-2'>
              View Receipt
              <Icon name='receipt-fill' className='w-5 h-5' />
            </span>
          </button>
        ) : (
          <button
            onClick={onPay}
            disabled={isPayDisabled}
            className={cn(
              'flex items-center justify-center w-full mx-auto h-14 text-lg font-semibold bg-linear-to-r from-slate-500/80 via-slate-600 to-slate-500/80 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xs',
              {
                'hover:from-slate-500 hover:to-slate-400': enablePayHoverStyles,
              },
            )}>
            {isPayProcessing ? (
              <Icon name='spinner-dots' className='w-5 h-5' />
            ) : (
              <span className='flex items-center font-polysans font-bold text-white opacity-100 gap-2 drop-shadow-xs'>
                {payLabel}
                <Icon name='cash-fast' className='w-7 h-7' />
              </span>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
