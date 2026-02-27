'use client'

import {Order} from '@/app/admin/(routes)/ops/types'
import {TxData} from '@/app/api/crypto/types'
import {
  SearchParamsProvider,
  useSearchParams,
} from '@/components/sepolia/search-params-context'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {ITxData} from '@/convex/orders/d'
import {useCopy} from '@/hooks/use-copy'
import {useCrypto} from '@/hooks/use-crypto'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {parseHexToInt} from '@/utils/formatPrice'
import {Tabs} from '@base-ui/react/tabs'
import {Button, Image, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useParams} from 'next/navigation'
import QRCode from 'qrcode'
import {
  ChangeEvent,
  startTransition,
  SubmitEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react'

const CRYPTO_WALLET_IDENTIFIER = 'crypto_wallet_addresses'

type CryptoWalletAddresses = {
  bitcoin: string
  ethereum: string
  polygon: string
}

/** Network keys that have wallet addresses in admin settings (used for indexing) */
type SendPageNetwork = keyof CryptoWalletAddresses

function parseCryptoWallets(value: unknown): CryptoWalletAddresses {
  if (!value || typeof value !== 'object' || 'error' in value) {
    return {bitcoin: '', ethereum: '', polygon: ''}
  }
  const wallets = value as Record<string, unknown>
  return {
    bitcoin: typeof wallets.bitcoin === 'string' ? wallets.bitcoin : '',
    ethereum: typeof wallets.ethereum === 'string' ? wallets.ethereum : '',
    polygon: typeof wallets.polygon === 'string' ? wallets.polygon : '',
  }
}

function buildPaymentRequestUri(
  network: SendPageNetwork,
  wallets: CryptoWalletAddresses,
): string | null {
  const addr = wallets[network]
  if (!addr?.trim()) return null
  if (network === 'bitcoin') return `bitcoin:${addr}`
  if (network === 'ethereum') return `ethereum:${addr}@1`
  if (network === 'polygon') return `ethereum:${addr}@137`
  return null
}

const CryptoSendContent = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const updatePayment = useMutation(api.orders.m.updatePayment)
  const {setParams} = useSearchParams()
  const {getBySymbol} = useCrypto()
  const [selected, setSelected] = useState<SendPageNetwork>('bitcoin')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const order = useQuery(api.orders.q.getById, {id: orderId})

  const cryptoSetting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: CRYPTO_WALLET_IDENTIFIER,
  })
  const wallets = useMemo(
    () => parseCryptoWallets(cryptoSetting),
    [cryptoSetting],
  )

  const paymentRequestUri = useMemo(
    () => buildPaymentRequestUri(selected, wallets),
    [selected, wallets],
  )

  useEffect(() => {
    if (!paymentRequestUri) {
      startTransition(() => {
        setQrDataUrl(null)
      })
      return
    }
    let cancelled = false
    QRCode.toDataURL(paymentRequestUri, {margin: 2, width: 260})
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [paymentRequestUri])

  const walletAddress = wallets[selected]
  const {copy, copied} = useCopy({timeout: 2000})
  const copyAddress = useCallback(() => {
    if (!walletAddress?.trim()) return
    copy('Wallet Address', walletAddress.trim())
  }, [copy, walletAddress])

  const ethPrice = useMemo(
    () => getBySymbol('ETH')?.price ?? null,
    [getBySymbol],
  )

  const networks: SendPageNetwork[] = ['bitcoin', 'ethereum', 'polygon']

  return (
    <div className='relative z-100 md:-translate-x-2 md:w-3xl md:max-w-3xl md:mx-auto flex h-full'>
      <div className='w-full relative bg-linear-to-br from-zinc-900 via-zinc-950 to-zinc-950 overflow-hidden rounded-lg'>
        <motion.div
          initial={{opacity: 0, scale: 0.85}}
          animate={{opacity: 1, scale: 1}}
          exit={{opacity: 0, scale: 0.6}}
          transition={{duration: 0.2}}
          className='flex flex-col space-y-6 md:justify-between px-3 py-8 border-b-[0.33px] border-white/0 w-full'>
          <div className='flex items-center space-x-2 md:space-x-4 text-white/80 ps-2'>
            <Icon name='network' className='text-white/70 md:size-6 size-6' />
            <span className='flex font-brk text-sm uppercase'>
              <span className='flex mr-1'>Select</span>Network
            </span>
            {/*<span className='text-indigo-400'>Development In-progress...</span>*/}
          </div>
          <Tabs.Root
            value={selected}
            onValueChange={(v) => setSelected(v as SendPageNetwork)}>
            <Tabs.List className='relative z-0 flex justify-around md:justify-start gap-8 w-full mb-4 md:mb-0'>
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
              <SendToPanel
                qrDataUrl={qrDataUrl}
                walletAddress={walletAddress}
                copyFn={copyAddress}
                isCopied={copied}
                order={order}
                network='bitcoin'
                orderId={orderId}
                updatePayment={updatePayment}
              />
            </Tabs.Panel>
            <Tabs.Panel value='ethereum'>
              <SendToPanel
                qrDataUrl={qrDataUrl}
                walletAddress={walletAddress}
                copyFn={copyAddress}
                isCopied={copied}
                order={order}
                network='ethereum'
                orderId={orderId}
                updatePayment={updatePayment}
              />
            </Tabs.Panel>
            <Tabs.Panel value='polygon'>
              <SendToPanel
                qrDataUrl={qrDataUrl}
                walletAddress={walletAddress}
                copyFn={copyAddress}
                isCopied={copied}
                order={order}
                network='polygon'
                orderId={orderId}
                updatePayment={updatePayment}
              />
            </Tabs.Panel>
          </Tabs.Root>
        </motion.div>
      </div>
    </div>
  )
}

type UpdatePaymentFn = (args: {
  orderId: Id<'orders'>
  payment: Order['payment']
}) => Promise<unknown>

interface SendToPanelProps {
  qrDataUrl: string | null
  walletAddress: string
  copyFn: VoidFunction
  isCopied: boolean
  order: Order | null | undefined
  network: SendPageNetwork
  orderId: Id<'orders'>
  updatePayment: UpdatePaymentFn
}

function SendToPanel({
  qrDataUrl,
  walletAddress,
  copyFn,
  isCopied,
  order,
  network,
  orderId,
  updatePayment,
}: SendToPanelProps) {
  const [txnHash, setTxnHash] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTxnHash(event.target.value)
    setError(null)
  }, [])

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault()
      const hash = txnHash.trim()
      if (!hash || !order) return
      if (order.payment.status === 'completed') {
        setError('This order has already been paid')
        return
      }

      startTransition(async () => {
        setError(null)
        try {
          const res = await fetch('/api/crypto/verify-tx', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              txnHash: hash,
              network,
              expectedRecipient:
                walletAddress.toLowerCase().trim() || undefined,
            }),
          })

          const {success, error, data} = (await res.json()) as {
            success: boolean
            error?: string
            data?: TxData
          }

          if (!res.ok || !success) {
            setError(error ?? 'Transaction verification failed')
            return
          }

          console.log({data, value: parseHexToInt(data?.value)})

          await updatePayment({
            orderId,
            payment: {
              ...order.payment,
              status: 'completed',
              transactionId: hash.startsWith('0x') ? hash : `0x${hash}`,
              asset:
                network === 'bitcoin'
                  ? 'BTC'
                  : network === 'polygon'
                    ? 'MATIC'
                    : 'ETH',
              chain: network,
              paidAt: Date.now(),
              tx: data as ITxData,
            },
          })
        } catch (err) {
          setError('Failed to verify payment. Please try again.')
          console.error('Payment verification error:', err)
        }
      })
    },
    [order, txnHash, network, orderId, updatePayment, walletAddress],
  )

  return (
    <form onSubmit={handleSubmit} className='space-y-2 w-full'>
      <div className='flex items-center justify-center md:justify-start md:h-72 h-fit w-full rounded-lg border border-zinc-500 bg-zinc-200/20 mt-2 px-3 py-8 md:py-0'>
        {qrDataUrl ? (
          <div className='grid md:grid-cols-2 gap-8 md:gap-0 w-full place-items-center md:place-items-start'>
            <Image
              radius='sm'
              src={qrDataUrl}
              alt='Payment QR code'
              className='md:size-64 size-full aspect-square mx-auto object-contain shrink-0'
            />
            <div className='w-full place-items-center'>
              <p className='font-semibold text-lg text-center w-full'>
                Sending Crypto as Payment Guide
              </p>
              <ol className='list-decimal pl-2 mt-3'>
                <li>Select network/chain</li>
                <li>Open your crypto wallet</li>
                <li>Scan the QR code from your wallet</li>
                <li>Or copy the wallet address</li>
                <li>Copy the total amount to pay</li>
                <li>Paste the transaction hash below.</li>
                <li>Press {`"Confirm Payment"`}.</li>
              </ol>
            </div>
          </div>
        ) : (
          <Icon name='qrcode' className='text-zinc-500 size-16' />
        )}
      </div>
      <div
        className={cn(
          'py-1 flex w-full items-center justify-between rounded-sm transition-colors mt-4 md:mt-2',
          'hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none',
        )}>
        <span className='font-brk text-white/90'>Send to</span>
        <span className='text-white/80 text-sm'>{walletAddress}</span>
        <Icon
          name={isCopied ? 'check' : 'copy'}
          className='text-white/70 size-4'
          onClick={copyFn}
        />
      </div>
      <div className='flex items-center space-x-3'>
        <label htmlFor='txn-hash' className='whitespace-nowrap font-brk'>
          TxHash
        </label>
        <Input
          id='txn-hash'
          placeholder={network === 'bitcoin' ? 'txid (64 hex chars)' : '0x...'}
          value={txnHash}
          onChange={handleChange}
        />
      </div>
      {error ? (
        <p className='text-destructive text-sm' role='alert'>
          {error}
        </p>
      ) : null}
      <div className='flex items-center justify-end py-3'>
        <Button
          type='submit'
          size='lg'
          disabled={!txnHash.trim() || isPending}
          isLoading={isPending}>
          Confirm Payment
        </Button>
      </div>
    </form>
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
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={onSelect}
      // disabled={name === 'bitcoin'}
      className={cn(
        'relative flex items-center justify-center w-auto h-7 px-2.5 rounded-full overflow-hidden space-x-1 md:mx-2',
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
        {name}
      </p>
    </motion.div>
  )
}
