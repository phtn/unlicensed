'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Input, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useState, ViewTransition} from 'react'
import {ContentHeader} from './components'

const DEFAULT_TAX_RATE = '10'

export const TaxContent = () => {
  const {user} = useAuthCtx()
  const config = useQuery(api.admin.q.getTaxConfig)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const configKey =
    config !== undefined
      ? `${config.taxRatePercent}-${config.active}`
      : 'loading'

  return (
    <div className='flex w-full flex-col gap-4'>
      <ContentHeader title='Tax Configuration' />
      <TaxFormInner
        key={configKey}
        config={config}
        updateAdmin={updateAdmin}
        userUid={user?.uid}
      />
    </div>
  )
}

function TaxFormInner({
  config,
  updateAdmin,
  userUid,
}: {
  config: {taxRatePercent: number; active: boolean} | undefined
  updateAdmin: (args: {
    identifier: string
    value: Record<string, number | boolean>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const initialRate =
    config !== undefined ? String(config.taxRatePercent) : DEFAULT_TAX_RATE
  const initialActive = config?.active ?? true
  const [taxRatePercent, setTaxRatePercent] = useState(initialRate)
  const [active, setActive] = useState(initialActive)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const handleSave = useCallback(() => {
    const rate = parseFloat(taxRatePercent ?? '0')
    if (Number.isNaN(rate) || rate < 0 || rate > 100) return

    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: 'tax_config',
        value: {taxRatePercent: rate, active},
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
  }, [taxRatePercent, active, updateAdmin, userUid])

  return (
    <section className='flex w-md flex-col gap-4'>
      <div className='flex flex-col gap-4'>
        <Switch
          isSelected={active}
          onValueChange={setActive}
          isDisabled={config === undefined}>
          Tax active
        </Switch>
        <div className='flex max-w-44 flex-col gap-2'>
          <Input
            label='Tax rate (%)'
            type='number'
            min={0}
            max={100}
            step={0.01}
            value={taxRatePercent}
            onValueChange={setTaxRatePercent}
            classNames={commonInputClassNames}
            isDisabled={config === undefined || !active || isSaving}
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
