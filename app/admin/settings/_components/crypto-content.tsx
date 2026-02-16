'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useMemo, useState, ViewTransition} from 'react'

const CRYPTO_WALLET_IDENTIFIER = 'crypto_wallet_addresses'

type CryptoWalletAddresses = {
  bitcoin: string
  ethereum: string
  polygon: string
}

const EMPTY_WALLETS: CryptoWalletAddresses = {
  bitcoin: '',
  ethereum: '',
  polygon: '',
}

export const CryptoContent = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: CRYPTO_WALLET_IDENTIFIER,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const initialWallets = useMemo(() => parseCryptoWallets(setting), [setting])
  const walletsKey =
    setting === undefined
      ? 'loading'
      : `${initialWallets.bitcoin}-${initialWallets.ethereum}-${initialWallets.polygon}`

  return (
    <div className='flex w-full flex-col gap-4'>
      <SectionHeader title='Crypto Wallet Addresses' />
      <CryptoWalletFormInner
        key={walletsKey}
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
    bitcoin: typeof wallets.bitcoin === 'string' ? wallets.bitcoin : '',
    ethereum: typeof wallets.ethereum === 'string' ? wallets.ethereum : '',
    polygon: typeof wallets.polygon === 'string' ? wallets.polygon : '',
  }
}

function CryptoWalletFormInner({
  initialWallets,
  configLoaded,
  updateAdmin,
  userUid,
}: {
  initialWallets: CryptoWalletAddresses
  configLoaded: boolean
  updateAdmin: (args: {
    identifier: string
    value: Record<string, string>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const [bitcoin, setBitcoin] = useState(initialWallets.bitcoin)
  const [ethereum, setEthereum] = useState(initialWallets.ethereum)
  const [polygon, setPolygon] = useState(initialWallets.polygon)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: CRYPTO_WALLET_IDENTIFIER,
        value: {
          bitcoin: bitcoin.trim(),
          ethereum: ethereum.trim(),
          polygon: polygon.trim(),
        },
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
  }, [bitcoin, ethereum, polygon, updateAdmin, userUid])

  return (
    <section className='flex w-md flex-col gap-4'>
      <div className='flex flex-col gap-3'>
        <Input
          label='Bitcoin wallet address'
          placeholder='bc1...'
          value={bitcoin}
          onValueChange={setBitcoin}
          classNames={commonInputClassNames}
          isDisabled={!configLoaded}
        />
        <Input
          label='Ethereum wallet address'
          placeholder='0x...'
          value={ethereum}
          onValueChange={setEthereum}
          classNames={commonInputClassNames}
          isDisabled={!configLoaded}
        />
        <Input
          label='Polygon wallet address'
          placeholder='0x...'
          value={polygon}
          onValueChange={setPolygon}
          classNames={commonInputClassNames}
          isDisabled={!configLoaded}
        />
      </div>
      <ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            radius='none'
            color='default'
            variant='flat'
            onPress={handleSave}
            isDisabled={isSaving || !configLoaded || !userUid}
            className='rounded-sm'
            isLoading={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          {saveMessage === 'saved' && (
            <span className='text-sm text-emerald-600 dark:text-emerald-400'>
              Saved
            </span>
          )}
          {saveMessage === 'error' && (
            <span className='text-sm text-destructive'>Save failed</span>
          )}
        </div>
      </ViewTransition>
    </section>
  )
}
