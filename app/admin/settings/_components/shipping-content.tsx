'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useState, ViewTransition} from 'react'

const DEFAULT_FEE_DOLLARS = '5'
const DEFAULT_MIN_DOLLARS = '50'

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
      <SectionHeader title='Shipping Fee Configuration' />
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
    <section className='flex w-md flex-col gap-4'>
      <div className='flex space-x-3'>
        <div className='flex max-w-44 flex-col gap-2'>
          <Input
            label='Shipping fee ($)'
            type='number'
            min={0}
            step={0.01}
            value={shippingFeeDollars}
            onValueChange={setShippingFeeDollars}
            classNames={commonInputClassNames}
            isDisabled={config === undefined}
          />
        </div>
        <div className='flex max-w-64 flex-col gap-2'>
          <Input
            label='Minimum order amount ($) for free shipping'
            type='number'
            min={0}
            step={0.01}
            value={minimumOrderDollars}
            onValueChange={setMinimumOrderDollars}
            classNames={commonInputClassNames}
            isDisabled={config === undefined}
          />
        </div>
      </div>
      <ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            radius='none'
            color='default'
            variant='flat'
            onPress={handleSave}
            isDisabled={isSaving || config === undefined || !userUid}
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
