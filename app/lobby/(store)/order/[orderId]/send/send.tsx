'use client'

import {
  SearchParamsProvider,
  useSearchParams,
} from '@/components/sepolia/search-params-context'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useCrypto} from '@/hooks/use-crypto'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react/tabs'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useParams} from 'next/navigation'
import {useMemo, useRef, useState} from 'react'

const CryptoSendContent = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})
  const updatePayment = useMutation(api.orders.m.updatePayment)
  const {setParams} = useSearchParams()
  const {getBySymbol} = useCrypto()
  const [, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [selected, setSelected] = useState<AllowedNetworks>('bitcoin')
  const paymentSyncedTxHashRef = useRef<`0x${string}` | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const ethPrice = useMemo(
    () => getBySymbol('ETH')?.price ?? null,
    [getBySymbol],
  )

  // const defaultPaymentAmountUsd = useMemo(() => {
  //   if (order == null || order === undefined) return undefined
  //   return (order.totalCents / 100).toFixed(2)
  // }, [order])

  const networks: AllowedNetworks[] = ['bitcoin', 'ethereum', 'polygon']

  return (
    <div className='relative z-100 md:-translate-x-2 md:w-3xl md:max-w-3xl md:mx-auto flex h-full'>
      <div className='w-full relative bg-linear-to-br drop-shadow-xl drop-shadow-dark-table/50 from-zinc-900 via-zinc-950 to-zinc-950 overflow-hidden rounded-lg'>
        <motion.div
          initial={{opacity: 0, scale: 0.85}}
          animate={{opacity: 1, scale: 1}}
          exit={{opacity: 0, scale: 0.6}}
          transition={{duration: 0.2}}
          className='flex flex-col space-y-6 md:justify-between px-3 py-8 border-b-[0.33px] border-white/0 w-full'>
          <div className='flex items-center space-x-0.5 md:space-x-4 text-white/80 ps-2'>
            <Icon name='network' className='text-white/70 md:size-6 size-6' />
            <span className='hidden md:flex font-brk text-xs uppercase'>
              <span className='hidden md:flex mr-1'>Select</span>Network
            </span>
            <span className='text-indigo-500'>Development In-progress...</span>
          </div>
          <Tabs.Root defaultValue='bitcoin'>
            <Tabs.List className='relative z-0 flex gap-8 w-full '>
              {networks.map((tab) => (
                <Tabs.Tab
                  key={tab}
                  className={cn(
                    'flex h-8 items-center justify-center border-0 break-keep whitespace-nowrap',
                    'text-sm font-medium data-active:text-white font-okxs',
                    'outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm',
                    'transition-colors duration-100 delay-100',
                  )}
                  value={tab}>
                  <NetworkButtonRound
                    name={tab}
                    selected={tab === selected}
                    onSelect={() => setSelected(tab)}
                  />
                </Tabs.Tab>
              ))}
              <Tabs.Indicator className='absolute top-1/2 left-0 z-[-1] w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-sm bg-linear-to-r from-slate-700/90 via-slate-900/90 to-origin dark:bg-dark-table dark:via-slate-800 dark:to-slate-800 transition-all duration-300 ease-in-out' />
            </Tabs.List>
            <Tabs.Panel value='bitcoin'>
              <div className='flex items-center justify-center h-72 w-full rounded-lg border border-zinc-500 bg-zinc-200/20 mt-2'>
                <Icon name='qrcode' />
              </div>
              <div className='py-1 flex items-center justify-between '>
                <span className='font-brk'>Send to</span>
                <span>Copy Addresss</span>
                <Icon name='copy' />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value='ethereum'>
              <div>Ethereum</div>
            </Tabs.Panel>
            <Tabs.Panel value='polygon'>
              <div>Polygon</div>
            </Tabs.Panel>
          </Tabs.Root>
        </motion.div>
      </div>
    </div>
  )
}

export const CryptoSend = () => {
  return (
    <SearchParamsProvider>
      <CryptoSendContent />
    </SearchParamsProvider>
  )
}

type AllowedNetworks = 'ethereum' | 'polygon' | 'bitcoin' | 'sepolia' | 'amoy'
interface NetworkButtonRoundProps {
  name: AllowedNetworks
  onSelect?: VoidFunction
  selected: boolean
}
const NetworkButtonRound = ({
  name,
  onSelect,
  selected,
}: NetworkButtonRoundProps) => {
  return (
    <motion.button
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={onSelect}
      // disabled={name === 'bitcoin'}
      className={cn(
        'relative flex items-center justify-center w-auto h-7 px-2.5 rounded-full overflow-hidden space-x-1 mx-2',
        {
          'bg-white': selected,
          'hover:bg-white/2 ': !selected,
          'cursor-pointer': true,
        },
      )}>
      <Icon
        name={
          name === 'bitcoin'
            ? 'bitcoin'
            : name === 'sepolia'
              ? 'ethereum'
              : name === 'polygon' || name === 'amoy'
                ? 'polygon'
                : 'ethereum'
        }
        className={cn('text-slate-300 size-4', {
          'size-4': selected,
          'text-rose-400': name === 'sepolia' && selected,
          'text-polygon': name === 'polygon' && selected,
          'text-ethereum': name === 'ethereum' && selected,
          'text-rose-300': name === 'amoy' && selected,
          'text-bitcoin': name === 'bitcoin' && selected,
        })}
      />
      <p
        className={cn('font-brk opacity-80 text-sm text-white capitalize', {
          'opacity-100 text-dark-table max-w-[8ch]': selected,
        })}>
        {/*{name === 'bitcoin' && !selected ? 'BTC' : name}*/}
        {name}
      </p>
    </motion.button>
  )
}
