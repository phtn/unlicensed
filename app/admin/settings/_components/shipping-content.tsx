'use client'

import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useState, ViewTransition} from 'react'
import {ContentHeader} from './components'

const DEFAULT_FEE_DOLLARS = '12.99'
const DEFAULT_MIN_DOLLARS = '49.00'

export const ShippingContent = () => {
  const {user} = useAuthCtx()
  const config = useQuery(api.admin.q.getShippingConfig)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const configKey =
    config !== undefined
      ? `${config.shippingFeeCents}-${config.minimumOrderCents}`
      : 'loading'

  return (
    <div className='flex w-full flex-col gap-4'>
      <ContentHeader title='Shipping Fee Configuration' />
      <ShippingFormInner
        key={configKey}
        config={config}
        updateAdmin={updateAdmin}
        userUid={user?.uid}
      />
    </div>
  )
}

function ShippingFormInner({
  config,
  updateAdmin,
  userUid,
}: {
  config: {shippingFeeCents: number; minimumOrderCents: number} | undefined
  updateAdmin: (args: {
    identifier: string
    value: Record<string, number>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const initialFee =
    config !== undefined
      ? String(config.shippingFeeCents / 100)
      : DEFAULT_FEE_DOLLARS
  const initialMin =
    config !== undefined
      ? String(config.minimumOrderCents / 100)
      : DEFAULT_MIN_DOLLARS
  const [shippingFeeDollars, setShippingFeeDollars] = useState(initialFee)
  const [minimumOrderDollars, setMinimumOrderDollars] = useState(initialMin)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const handleSave = useCallback(() => {
    const feeCents = Math.round(parseFloat(shippingFeeDollars || '0') * 100)
    const minCents = Math.round(parseFloat(minimumOrderDollars || '0') * 100)
    if (Number.isNaN(feeCents) || Number.isNaN(minCents)) return

    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: 'shipping_config',
        value: {shippingFeeCents: feeCents, minimumOrderCents: minCents},
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
  }, [shippingFeeDollars, minimumOrderDollars, updateAdmin, userUid])

  return (
    <section className='flex w-full flex-col gap-4 md:w-md'>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='flex w-full flex-col gap-2 sm:max-w-44'>
          <Input
            label='Shipping fee ($)'
            id='shipping-fee'
            type='number'
            min={0}
            step={0.01}
            value={shippingFeeDollars}
            onChange={(e) => setShippingFeeDollars(e.target.value)}
            disabled={config === undefined}
          />
        </div>
        <div className='flex w-full flex-col gap-2 sm:max-w-64'>
          <Input
            label='Minimum order amount ($)'
            id='minimum-order'
            type='number'
            min={0}
            step={0.01}
            value={minimumOrderDollars}
            onChange={(e) => setMinimumOrderDollars(e.target.value)}
            // classNames={commonInputClassNames}
            disabled={config === undefined}
          />
        </div>
      </div>
      <ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            variant='tertiary'
            onPress={handleSave}
            isDisabled={isSaving || config === undefined || !userUid}
            className='rounded-sm px-8'
            isPending={isSaving}
          >
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
