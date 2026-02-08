import {Icon} from '@/lib/icons'
import {motion} from 'motion/react'
interface PaymentProcessingProps {
  tokenAmount: string
  tokenSymbol: string
  usdValue: number | null
}

export const PaymentProcessing = ({
  tokenAmount,
  tokenSymbol,
  usdValue,
}: PaymentProcessingProps) => {
  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -10}}
      className='relative rounded-xl bg-white/5 border border-white/10 space-y-0 overflow-hidden'>
      <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
      <div className='relative px-4 py-6'>
        <div className='flex flex-col items-center justify-center gap-4'>
          <motion.div
            animate={{rotate: 360}}
            transition={{duration: 2, repeat: Infinity, ease: 'linear'}}
            className='w-12 h-12 rounded-full border-2 border-lime-300/30 border-t-lime-300 flex items-center justify-center'>
            <Icon name='spinners-ring' className='w-6 h-6 text-lime-100' />
          </motion.div>
          <div className='text-center space-y-1'>
            <p className='font-polyn font-bold text-xl text-white/80'>
              Processing Payment
            </p>
            <p className='text-xs font-brk text-white/50'>
              Please confirm in your wallet
            </p>
          </div>
        </div>
        <div className='mt-6 pt-4 border-t border-white/10 border-dashed space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-exo font-bold italic uppercase opacity-60'>
              Amount
            </span>
            <div className='text-right'>
              <span className='text-sm font-okxs text-white'>
                {tokenAmount} <span className='uppercase'>{tokenSymbol}</span>
              </span>
              {usdValue !== null && (
                <p className='text-sm font-okxs leading-none flex items-center space-x-1'>
                  <span className='font-mono text-lg'>≈</span>
                  <span>
                    <span className='opacity-70'>$</span>
                    <span className=''>
                      {usdValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
