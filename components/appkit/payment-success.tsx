import {Icon} from '@/lib/icons'
import {motion} from 'motion/react'

interface PaymentSuccessProps {
  tokenAmount: string
  tokenSymbol: string
  usdValue: number | null
  hash: `0x${string}` | null
  explorerUrl: string | null
}

export const PaymentSuccess = ({
  tokenAmount,
  tokenSymbol,
  usdValue,
  hash,
  explorerUrl,
}: PaymentSuccessProps) => {
  return (
    <motion.div
      initial={{opacity: 0, scale: 0.95}}
      animate={{opacity: 1, scale: 1}}
      exit={{opacity: 0, scale: 0.95}}
      className='relative rounded-3xl border border-emerald-400/30 space-y-0 overflow-hidden'>
      <div className='absolute bg-[url("/svg/noise.svg")] opacity-15 scale-100 pointer-events-none top-0 left-0 w-full h-full' />
      <div className='relative bg-emerald-500/10 px-4 py-6'>
        <div className='flex items-center gap-4'>
          <motion.div
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{type: 'spring', stiffness: 200, damping: 15}}
            className='w-10 h-10 relative rounded-full border-6 border-emerald-300/2 bg-emerald-400/10 backdrop-blur-3xl flex items-center justify-center'>
            <Icon
              name='check'
              className='w-8 h-8 absolute blur-xl text-emerald-300 animate-pulse'
            />
            <Icon
              name='check'
              className='w-6 h-6 absolute blur-xs text-white'
            />
            <Icon name='check' className='w-6 h-6 relative text-emerald-200' />
          </motion.div>
          <div className='space-y-1 w-full'>
            <div className='flex items-center justify-between w-full'>
              <p className='flex text-lg font-polyn font-bold text-emerald-50 w-full'>
                Transaction Successful
              </p>
              {hash && (
                <a
                  href={`${explorerUrl}/${hash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:underline underline-offset-4 decoration-emerald-200 decoration-dotted'>
                  <div className='flex flex-1 space-x-1 text-white font-brk text-xs tracking-widest'>
                    <span>TXN</span>
                    <Icon
                      name='external-link-line'
                      className='size-4 relative text-emerald-200'
                    />
                  </div>
                </a>
              )}
            </div>

            <p className='text-xs text-white font-brk opacity-70'>
              Your transaction has been confirmed
            </p>
          </div>
        </div>
        <div className='mt-6 pt-4 border-t border-emerald-200/40 border-dashed space-y-3'>
          <div className='flex items-start justify-between'>
            <span className='text-sm font-polysans font-medium uppercase opacity-70 text-white'>
              Amount
            </span>
            <div className='text-right'>
              <span className='text-sm font-okxs text-white'>
                {tokenAmount} <span className='uppercase'>{tokenSymbol}</span>
              </span>
              {usdValue !== null && (
                <p className='text-base font-okxs font-medium text-white'>
                  $
                  {usdValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
