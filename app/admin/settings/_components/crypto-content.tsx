'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {PrimaryButton} from '@/app/admin/settings/_components/components'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Input, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'

const CRYPTO_WALLET_IDENTIFIER = 'crypto_wallet_addresses'

const NETWORKS = [
  {
    key: 'bitcoin',
    label: 'Bitcoin',
    shortLabel: 'BTC',
    placeholder: 'bc1...',
  },
  {
    key: 'ethereum',
    label: 'Ethereum',
    shortLabel: 'ETH',
    placeholder: '0x...',
  },
  {
    key: 'polygon',
    label: 'Polygon',
    shortLabel: 'POL',
    placeholder: '0x...',
  },
  {
    key: 'sepolia',
    label: 'Sepolia',
    shortLabel: 'Sepolia',
    placeholder: '0x...',
  },
  {
    key: 'amoy',
    label: 'Amoy',
    shortLabel: 'Amoy',
    placeholder: '0x...',
  },
] as const

type NetworkKey = (typeof NETWORKS)[number]['key']

type CryptoNetworkConfig = {
  address: string
  active: boolean
}

type CryptoWalletAddresses = Record<NetworkKey, CryptoNetworkConfig>

const EMPTY_WALLETS: CryptoWalletAddresses = {
  bitcoin: {address: '', active: true},
  ethereum: {address: '', active: true},
  polygon: {address: '', active: true},
  sepolia: {address: '', active: false},
  amoy: {address: '', active: false},
}

const getNetworkConfig = (
  wallets: Record<string, unknown>,
  key: NetworkKey,
): CryptoNetworkConfig => {
  const entry = wallets[key]

  if (typeof entry === 'string') {
    return {
      address: entry,
      active: entry.trim().length > 0 || EMPTY_WALLETS[key].active,
    }
  }

  if (entry && typeof entry === 'object') {
    const config = entry as Record<string, unknown>
    return {
      address: typeof config.address === 'string' ? config.address : '',
      active:
        typeof config.active === 'boolean'
          ? config.active
          : EMPTY_WALLETS[key].active,
    }
  }

  return EMPTY_WALLETS[key]
}

export const CryptoContent = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: CRYPTO_WALLET_IDENTIFIER,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const initialWallets = useMemo(() => parseCryptoWallets(setting), [setting])
  const walletsKey =
    setting === undefined ? 'loading' : JSON.stringify(initialWallets)

  return (
    <div className='flex w-full flex-col gap-4'>
      <CryptoWalletFormInner
        key={walletsKey}
        title='Crypto Wallet Addresses'
        initialWallets={initialWallets}
        configLoaded={setting !== undefined}
        updateAdmin={updateAdmin}
        userUid={user?.uid}
      />
    </div>
  )
}

function parseCryptoWallets(value: unknown): CryptoWalletAddresses {
  if (!value || typeof value !== 'object' || 'error' in value) {
    return EMPTY_WALLETS
  }

  const wallets = value as Record<string, unknown>

  return {
    bitcoin: getNetworkConfig(wallets, 'bitcoin'),
    ethereum: getNetworkConfig(wallets, 'ethereum'),
    polygon: getNetworkConfig(wallets, 'polygon'),
    sepolia: getNetworkConfig(wallets, 'sepolia'),
    amoy: getNetworkConfig(wallets, 'amoy'),
  }
}

function CryptoWalletFormInner({
  title,
  initialWallets,
  configLoaded,
  updateAdmin,
  userUid,
}: {
  title: string
  initialWallets: CryptoWalletAddresses
  configLoaded: boolean
  updateAdmin: (args: {
    identifier: string
    value: Record<string, unknown>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const [wallets, setWallets] = useState(initialWallets)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const handleAddressChange = useCallback(
    (key: NetworkKey, address: string) => {
      setWallets((current) => ({
        ...current,
        [key]: {
          ...current[key],
          address,
        },
      }))
    },
    [],
  )

  const handleActiveChange = useCallback((key: NetworkKey, active: boolean) => {
    setWallets((current) => ({
      ...current,
      [key]: {
        ...current[key],
        active,
      },
    }))
  }, [])

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setSaveMessage(null)

    startTransition(() => {
      updateAdmin({
        identifier: CRYPTO_WALLET_IDENTIFIER,
        value: Object.fromEntries(
          NETWORKS.map(({key}) => [
            key,
            {
              address: wallets[key].address.trim(),
              active: wallets[key].active,
            },
          ]),
        ),
        uid: userUid ?? 'anonymous',
      })
        .then(() => {
          setIsSaving(false)
          setSaveMessage('saved')
          setTimeout(() => setSaveMessage(null), 2000)
        })
        .catch(() => {
          setIsSaving(false)
          setSaveMessage('error')
        })
    })
  }, [updateAdmin, userUid, wallets])

  return (
    <section className='flex flex-col gap-4 h-[90lvh] md:w-[82lvw] overflow-y-scroll pb-32'>
      <SectionHeader title={title}>
        <div className='flex items-center justify-end gap-3'>
          <ViewTransition>
            {saveMessage === 'saved' ? (
              <span className='text-sm text-emerald-600 dark:text-emerald-400'>
                Saved
              </span>
            ) : saveMessage === 'error' ? (
              <span className='text-sm text-destructive'>Save failed</span>
            ) : null}
          </ViewTransition>
          <PrimaryButton
            onPress={handleSave}
            label={isSaving ? 'Saving…' : 'Save'}
            disabled={isSaving || !configLoaded || !userUid}
            icon={isSaving ? 'spinners-ring' : 'save'}
          />
        </div>
      </SectionHeader>

      <div className='grid md:grid-cols-3 gap-3 w-full'>
        {NETWORKS.map((network) => (
          <div
            key={network.key}
            className='rounded-lg border border-default-200 bg-content1 p-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='w-fit'>
                <div className='text-sm font-clash font-semibold tracking-wider text-foreground'>
                  {network.label}{' '}
                  {(network.label === 'Sepolia' ||
                    network.label === 'Amoy') && (
                    <span className='text-xs text-indigo-500 dark:text-indigo-400 font-ios font-semibold uppercase px-1'>
                      Devnet
                    </span>
                  )}
                </div>
                <div className='text-xs text-default-500'>
                  {network.shortLabel} network address
                </div>
              </div>
              <Switch
                isSelected={wallets[network.key].active}
                onValueChange={(active) =>
                  handleActiveChange(network.key, active)
                }
                isDisabled={!configLoaded}
                size='sm'>
                Active
              </Switch>
            </div>
            <Input
              label={`${network.label} wallet address`}
              placeholder={network.placeholder}
              value={wallets[network.key].address}
              onValueChange={(address) =>
                handleAddressChange(network.key, address)
              }
              classNames={commonInputClassNames}
              className='mt-4 w-full'
              isDisabled={!configLoaded}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
