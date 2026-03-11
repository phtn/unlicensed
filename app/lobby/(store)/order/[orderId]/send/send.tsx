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
import {Tabs} from '@base-ui/react/tabs'
import {Button, Image, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {motion} from 'motion/react'
import {useParams} from 'next/navigation'
import QRCode from 'qrcode'
import {
  ChangeEvent,
  type RefObject,
  startTransition,
  SubmitEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'

const CRYPTO_WALLET_IDENTIFIER = 'crypto_wallet_relay'
const CRYPTO_TOKEN_RELAY_IDENTIFIER = 'crypto-wallet-relay'

type CryptoWalletAddresses = {
  bitcoin: string
  ethereum: string
  polygon: string
  sepolia: string
}

type RelayWalletAddresses = Record<string, string>

type ManualPaymentToken = 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'

/** Network keys that have wallet addresses in admin settings (used for indexing) */
type SendPageNetwork = keyof CryptoWalletAddresses

export function normalizePaymentReference(reference: string): string | null {
  const trimmed = reference.trim()
  if (!trimmed) {
    return null
  }

  const maybeHash = trimmed.replace(/^0x/i, '')
  if (/^[0-9a-fA-F]{64}$/.test(maybeHash)) {
    return `0x${maybeHash.toLowerCase()}`
  }

  return trimmed
}

function parseCryptoWallets(value: unknown): CryptoWalletAddresses {
  if (!value || typeof value !== 'object' || 'error' in value) {
    return {bitcoin: '', ethereum: '', polygon: '', sepolia: ''}
  }
  const wallets = value as Record<string, unknown>
  return {
    bitcoin: typeof wallets.bitcoin === 'string' ? wallets.bitcoin : '',
    ethereum: typeof wallets.ethereum === 'string' ? wallets.ethereum : '',
    polygon: typeof wallets.polygon === 'string' ? wallets.polygon : '',
    sepolia: typeof wallets.sepolia === 'string' ? wallets.sepolia : '',
  }
}

function getWalletAddressForNetwork(
  network: SendPageNetwork,
  wallets: CryptoWalletAddresses,
): string {
  if (network === 'sepolia') {
    return wallets.sepolia || wallets.ethereum
  }
  return wallets[network]
}

function buildPaymentRequestUri(
  network: SendPageNetwork,
  wallets: CryptoWalletAddresses,
): string | null {
  const addr = getWalletAddressForNetwork(network, wallets)
  if (!addr?.trim()) return null
  if (network === 'bitcoin') return `bitcoin:${addr}`
  if (network === 'ethereum') return `ethereum:${addr}@1`
  if (network === 'polygon') return `ethereum:${addr}@137`
  if (network === 'sepolia') return `ethereum:${addr}@11155111`
  return null
}

function parseRelayWallets(value: unknown): RelayWalletAddresses {
  if (!value || typeof value !== 'object' || 'error' in value) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      typeof entry === 'string' && entry.trim()
        ? [[key.toLowerCase(), entry.trim()]]
        : [],
    ),
  )
}

function resolvePaymentToken(
  network: SendPageNetwork,
  asset: string | null | undefined,
  tokenSelected: string | null | undefined,
): ManualPaymentToken {
  if (network === 'bitcoin') return 'bitcoin'

  const candidate = (asset ?? tokenSelected ?? '').trim().toLowerCase()
  if (candidate === 'usdc') return 'usdc'
  if (candidate === 'usdt') return 'usdt'

  return 'ethereum'
}

function getStableRelayKeys(
  network: Exclude<SendPageNetwork, 'bitcoin'>,
  token: Extract<ManualPaymentToken, 'usdc' | 'usdt'>,
): string[] {
  if (network === 'ethereum') {
    return [`eth${token}`, `ethereum${token}`]
  }

  if (network === 'polygon') {
    return [`polygon${token}`, `matic${token}`, `poly${token}`]
  }

  return [`sepolia${token}`]
}

export function getExpectedRecipientAddress(
  network: SendPageNetwork,
  paymentToken: ManualPaymentToken,
  walletAddress: string,
  relayWallets: RelayWalletAddresses,
): string {
  if (
    network === 'bitcoin' ||
    paymentToken === 'bitcoin' ||
    paymentToken === 'ethereum'
  ) {
    return walletAddress
  }

  for (const key of getStableRelayKeys(network, paymentToken)) {
    const relayAddress = relayWallets[key]
    if (relayAddress) {
      return relayAddress
    }
  }

  return walletAddress
}

export function getExpectedValueBaseUnits(args: {
  network: SendPageNetwork
  paymentToken: ManualPaymentToken
  orderTotalCents: number
  getBySymbol: (symbol: string) => {price: number} | null
}): string | undefined {
  const {network, paymentToken, orderTotalCents, getBySymbol} = args

  if (paymentToken === 'usdc' || paymentToken === 'usdt') {
    return (BigInt(orderTotalCents) * BigInt(10_000)).toString()
  }

  const tokenPrice =
    network === 'ethereum' || network === 'sepolia'
      ? getBySymbol('ETH')?.price
      : network === 'polygon'
        ? (getBySymbol('POL')?.price ?? getBySymbol('MATIC')?.price)
        : null

  if (
    tokenPrice == null ||
    !Number.isFinite(tokenPrice) ||
    (network !== 'ethereum' && network !== 'polygon' && network !== 'sepolia')
  ) {
    return undefined
  }

  return BigInt(
    Math.floor((orderTotalCents / 100 / tokenPrice) * 1e18),
  ).toString()
}

export function getPaymentAssetSymbol(
  network: SendPageNetwork,
  paymentToken: ManualPaymentToken,
): string {
  if (paymentToken === 'bitcoin') return 'BTC'
  if (paymentToken === 'usdc') return 'USDC'
  if (paymentToken === 'usdt') return 'USDT'
  return network === 'polygon' ? 'MATIC' : 'ETH'
}

type VerificationRequest = {
  txnHash: string
  network: SendPageNetwork
  paymentToken: ManualPaymentToken
  expectedRecipient: string
  expectedValueWei?: string
}

type VerificationResponse = {
  success: boolean
  error?: string
  data?: TxData
}

export function buildVerificationCandidates(args: {
  network: SendPageNetwork
  initialToken: ManualPaymentToken
  walletAddress: string
  relayWallets: RelayWalletAddresses
}): Array<{
  paymentToken: ManualPaymentToken
  expectedRecipient: string
}> {
  const {network, initialToken, walletAddress, relayWallets} = args
  const orderedTokens =
    network === 'bitcoin'
      ? (['bitcoin'] as const)
      : initialToken === 'ethereum'
        ? (['ethereum', 'usdc', 'usdt'] as const)
        : ([initialToken, 'usdc', 'usdt', 'ethereum'] as const)

  const seen = new Set<string>()

  return orderedTokens.flatMap((candidateToken) => {
    const recipient = getExpectedRecipientAddress(
      network,
      candidateToken,
      walletAddress,
      relayWallets,
    )
    const key = `${candidateToken}:${recipient.toLowerCase()}`
    if (seen.has(key)) return []
    seen.add(key)
    return [{paymentToken: candidateToken, expectedRecipient: recipient}]
  })
}

async function verifyTransactionCandidate({
  txnHash,
  network,
  paymentToken,
  expectedRecipient,
  expectedValueWei,
}: VerificationRequest): Promise<VerificationResponse> {
  const res = await fetch('/api/crypto/verify-tx', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      txnHash,
      network,
      paymentToken: paymentToken === 'bitcoin' ? undefined : paymentToken,
      expectedRecipient: expectedRecipient.toLowerCase().trim() || undefined,
      expectedValueWei,
    }),
  })

  const payload = (await res.json()) as VerificationResponse
  if (!res.ok) {
    return {
      success: false,
      error: payload.error ?? 'Transaction verification failed',
    }
  }

  return payload
}

const CryptoSendContent = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const updatePayment = useMutation(api.orders.m.updatePayment)
  const {params: searchParams} = useSearchParams()
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
  const relaySetting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: CRYPTO_TOKEN_RELAY_IDENTIFIER,
  })
  const relayWallets = useMemo(
    () => parseRelayWallets(relaySetting),
    [relaySetting],
  )

  const paymentRequestUri = useMemo(
    () => buildPaymentRequestUri(selected, wallets),
    [selected, wallets],
  )
  const relayedPaymentHashRef = useRef<string | null>(null)

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

  const walletAddress = getWalletAddressForNetwork(selected, wallets)
  const {copy, copied} = useCopy({timeout: 2000})
  const copyAddress = useCallback(() => {
    if (!walletAddress?.trim()) return
    copy('Wallet Address', walletAddress.trim())
  }, [copy, walletAddress])

  const _ethPrice = useMemo(
    () => getBySymbol('ETH')?.price ?? null,
    [getBySymbol],
  )

  const networks: SendPageNetwork[] = ['bitcoin', 'ethereum', 'polygon']

  return (
    <div className='relative z-100 md:-translate-x-2 md:w-3xl md:max-w-3xl md:mx-auto flex h-full'>
      <div className='w-full relative bg-linear-to-br dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 overflow-hidden'>
        <motion.div
          initial={{opacity: 0, scale: 0.85}}
          animate={{opacity: 1, scale: 1}}
          exit={{opacity: 0, scale: 0.6}}
          transition={{duration: 0.2}}
          className='flex flex-col space-y-6 md:justify-between px-3 py-6 w-full'>
          <div className='flex items-center space-x-2 md:space-x-4 ps-2'>
            <Icon name='network' className='opacity-70 md:size-6 size-6' />
            <span className='flex font-brk text-sm uppercase'>
              <span className='flex mr-1'>Select</span>Network
            </span>
            {/*<span className='text-indigo-400'>Development In-progress...</span>*/}
          </div>
          <Tabs.Root
            value={selected}
            onValueChange={(v) => setSelected(v as SendPageNetwork)}>
            <Tabs.List className='relative z-0 flex justify-around md:justify-start gap-8 w-full mb-4 md:mb-6'>
              {networks.map((tab) => (
                <Tabs.Tab
                  key={tab}
                  className={cn(
                    'flex h-8 items-center justify-center border-0 break-keep whitespace-nowrap',
                    'text-sm font-medium font-okxs text-dark-table dark:text-white/80',
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
                getBySymbol={getBySymbol}
                relayedPaymentHashRef={relayedPaymentHashRef}
                relayWallets={relayWallets}
                tokenSelected={searchParams.tokenSelected}
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
                getBySymbol={getBySymbol}
                relayedPaymentHashRef={relayedPaymentHashRef}
                relayWallets={relayWallets}
                tokenSelected={searchParams.tokenSelected}
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
                getBySymbol={getBySymbol}
                relayedPaymentHashRef={relayedPaymentHashRef}
                relayWallets={relayWallets}
                tokenSelected={searchParams.tokenSelected}
              />
            </Tabs.Panel>
            <Tabs.Panel value='sepolia'>
              <SendToPanel
                qrDataUrl={qrDataUrl}
                walletAddress={walletAddress}
                copyFn={copyAddress}
                isCopied={copied}
                order={order}
                network='sepolia'
                orderId={orderId}
                updatePayment={updatePayment}
                getBySymbol={getBySymbol}
                relayedPaymentHashRef={relayedPaymentHashRef}
                relayWallets={relayWallets}
                tokenSelected={searchParams.tokenSelected}
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
  getBySymbol: (symbol: string) => {price: number} | null
  relayedPaymentHashRef: RefObject<string | null>
  relayWallets: RelayWalletAddresses
  tokenSelected: string | null
}

export function toOrderTxData(data?: TxData): ITxData | undefined {
  if (!data) {
    return undefined
  }

  return {
    from: data.from,
    to: data.to,
    value: data.value,
    gasUsed: data.gasUsed,
    gasPrice: data.gasPrice,
    status: data.status,
    blockNumber: data.blockNumber,
    contractAddress: data.contractAddress ?? undefined,
  }
}

export function SendToPanel({
  qrDataUrl,
  walletAddress,
  copyFn,
  isCopied,
  order,
  network,
  orderId,
  updatePayment,
  getBySymbol,
  relayedPaymentHashRef,
  relayWallets,
  tokenSelected,
}: SendToPanelProps) {
  const [txnHash, setTxnHash] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const normalizedTxnHash = useMemo(
    () => normalizePaymentReference(txnHash),
    [txnHash],
  )
  const existingPaymentReference = useQuery(
    api.orders.q.getOrderUsingPaymentReference,
    normalizedTxnHash
      ? {
          transactionId: normalizedTxnHash,
          excludeOrderId: orderId,
        }
      : 'skip',
  )
  const duplicateHashMessage = existingPaymentReference
    ? `This transaction hash is already linked to order ${existingPaymentReference.orderNumber}.`
    : null
  const isCheckingTxnHash = Boolean(
    normalizedTxnHash && existingPaymentReference === undefined,
  )
  const paymentToken = useMemo(
    () => resolvePaymentToken(network, order?.payment.asset, tokenSelected),
    [network, order?.payment.asset, tokenSelected],
  )

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
      if (isCheckingTxnHash) {
        setError('Still checking that transaction hash. Try again in a moment.')
        return
      }
      if (duplicateHashMessage) {
        setError(duplicateHashMessage)
        return
      }

      startTransition(async () => {
        setError(null)
        try {
          const verificationCandidates = buildVerificationCandidates({
            network,
            initialToken: paymentToken,
            walletAddress,
            relayWallets,
          })
          let verifiedToken = paymentToken
          let verificationData: TxData | undefined
          let verificationError = 'Transaction verification failed'

          for (const candidate of verificationCandidates) {
            const result = await verifyTransactionCandidate({
              txnHash: hash,
              network,
              paymentToken: candidate.paymentToken,
              expectedRecipient: candidate.expectedRecipient,
              expectedValueWei: getExpectedValueBaseUnits({
                network,
                paymentToken: candidate.paymentToken,
                orderTotalCents: order.totalCents,
                getBySymbol,
              }),
            })

            if (result.success) {
              verifiedToken = candidate.paymentToken
              verificationData = result.data
              verificationError = ''
              break
            }

            verificationError = result.error ?? verificationError
          }

          if (verificationError) {
            setError(verificationError)
            return
          }

          await updatePayment({
            orderId,
            payment: {
              ...order.payment,
              status: 'completed',
              transactionId: hash.startsWith('0x') ? hash : `0x${hash}`,
              asset: getPaymentAssetSymbol(network, verifiedToken),
              chain: network,
              paidAt: Date.now(),
              tx: toOrderTxData(verificationData),
            },
          })

          const normalizedHash = hash.startsWith('0x') ? hash : `0x${hash}`
          if (relayedPaymentHashRef.current !== normalizedHash) {
            relayedPaymentHashRef.current = normalizedHash

            const relayResponse =
              network === 'bitcoin'
                ? await fetch('/api/relay/bitcoin', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      paymentHash: normalizedHash,
                    }),
                  })
                : await fetch('/api/relay', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      paymentHash: normalizedHash,
                      chainId:
                        network === 'sepolia'
                          ? 11155111
                          : network === 'polygon'
                            ? 137
                            : 1,
                      token: verifiedToken,
                    }),
                  })

            if (!relayResponse.ok) {
              relayedPaymentHashRef.current = null
              const payload = (await relayResponse
                .json()
                .catch(() => null)) as {
                error?: string
                message?: string
              } | null
              throw new Error(
                payload?.error ??
                  payload?.message ??
                  'Relay forwarding failed after payment verification.',
              )
            }
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to verify payment. Please try again.',
          )
          console.error('Payment verification error:', err)
        }
      })
    },
    [
      order,
      txnHash,
      network,
      orderId,
      updatePayment,
      isCheckingTxnHash,
      duplicateHashMessage,
      paymentToken,
      getBySymbol,
      relayedPaymentHashRef,
      walletAddress,
      relayWallets,
    ],
  )

  return (
    <form onSubmit={handleSubmit} className='space-y-2 w-full mt-4'>
      <div className='flex items-center justify-center md:justify-start md:h-72 h-fit w-full rounded-lg bg-zinc-200/20 dark:bg-dark-table/50 px-3 py-8 md:py-0'>
        {qrDataUrl ? (
          <div className='grid md:grid-cols-2 gap-8 md:gap-0 w-full place-items-center md:place-items-start'>
            <Image
              radius='sm'
              src={qrDataUrl}
              alt='Payment QR code'
              className='md:size-64 size-full aspect-square mx-auto object-contain shrink-0'
            />
            <div className='w-full place-items-center'>
              <p className='font-semibold text-lg text-center md:text-start w-full'>
                Send Crypto Guide
              </p>
              <ol className='list-decimal pl-1 mt-3'>
                <li>Select network/chain</li>
                <li>Open your crypto wallet</li>
                <li>Scan the QR code from your wallet</li>
                <li>Enter Total amount to pay</li>
                <li>Send your crypto payment</li>
                <li>Obtain send transaction hash</li>
                <li>Paste transaction hash below</li>
                <li>Press {`"Verify Payment"`}.</li>
              </ol>
            </div>
          </div>
        ) : (
          <Icon name='qrcode' className='text-zinc-500 size-16' />
        )}
      </div>
      <div
        className={cn(
          'py-2 flex w-full items-center justify-between transition-colors mt-4 md:my-4 border-b border-sidebar',
          'hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none',
        )}>
        <span className='font-brk dark:text-white/90'>Send to</span>
        <span className='dark:text-white/80 text-sm'>{walletAddress}</span>
        <Icon
          name={isCopied ? 'check' : 'copy'}
          className='dark:text-white/70 size-4'
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
          radius='none'
          value={txnHash}
          onChange={handleChange}
          className='rounded-sm'
        />
      </div>
      {duplicateHashMessage ? (
        <p className='text-destructive text-sm' role='status'>
          {duplicateHashMessage}
        </p>
      ) : isCheckingTxnHash ? (
        <p className='text-muted-foreground text-sm' role='status'>
          Checking whether this transaction hash has already been used...
        </p>
      ) : null}
      {error ? (
        <p className='text-destructive text-sm' role='alert'>
          {error}
        </p>
      ) : null}
      <div className='flex items-center justify-end py-3'>
        <Button
          size='lg'
          type='submit'
          radius='none'
          disabled={
            !txnHash.trim() ||
            isPending ||
            isCheckingTxnHash ||
            Boolean(duplicateHashMessage)
          }
          isLoading={isPending}>
          Verify Payment
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
        'relative flex items-center justify-center w-auto h-8 px-2.5 rounded-full overflow-hidden space-x-1 md:mx-2',
        {
          'dark:bg-white bg-dark-table dark:text-dark-table text-white':
            selected,
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
        className={cn('dark:text-slate-300 size-4 rounded-full', {
          'size-4 aspect-square shrink-0': selected,
          'text-rose-400': name === 'sepolia' && selected,
          'dark:text-polygon text-purple-400': name === 'polygon' && selected,
          'text-ethereum dark:text-ethereum': name === 'ethereum' && selected,
          'text-rose-300 ': name === 'amoy' && selected,
          'text-bitcoin dark:text-bitcoint': name === 'bitcoin' && selected,
        })}
      />
      <p
        className={cn('font-brk opacity-80 text-sm capitalize', {
          'opacity-100 max-w-[8ch]': selected,
        })}>
        {name}
      </p>
    </motion.div>
  )
}
