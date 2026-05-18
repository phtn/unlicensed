'use client'

import {ContentHeader} from '@/app/admin/settings/_components/components'
import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {getMetaPixelId, META_PIXEL_IDENTIFIER} from '@/lib/meta-pixel'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {ChangeEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {Toggle} from '../../_components/ui/toggle'

export const MpxlContent = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: META_PIXEL_IDENTIFIER,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const metapixelId = useMemo(() => getMetaPixelId(setting) ?? '', [setting])

  return (
    <div className='flex w-full flex-col gap-4'>
      <FormInner
        title='Metapixel Configuration'
        metapixelId={metapixelId}
        configLoaded={setting !== undefined}
        updateAdmin={updateAdmin}
        userUid={user?.uid}
      />
    </div>
  )
}

function FormInner({
  title,
  metapixelId,
  configLoaded,
  updateAdmin,
  userUid,
}: {
  title: string
  metapixelId: string
  configLoaded: boolean
  updateAdmin: (args: {
    identifier: string
    value: Record<string, unknown>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const [metapixel, setMetapixel] = useState(metapixelId)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  useEffect(() => {
    if (saveMessage && saveMessage === 'saved') {
      onSuccess('Meta Pixel settings saved')
    }
  }, [saveMessage])

  useEffect(() => {
    setMetapixel(metapixelId)
  }, [metapixelId])

  const handleChangeId = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.preventDefault()
      setMetapixel(e.target.value)
    },
    [setMetapixel],
  )

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setSaveMessage(null)

    updateAdmin({
      identifier: META_PIXEL_IDENTIFIER,
      value: {pixelId: metapixel.trim()},
      uid: userUid ?? 'anonymous',
    })
      .then(() => setSaveMessage('saved'))
      .catch(() => setSaveMessage('error'))
      .finally(() => setIsSaving(false))
  }, [metapixel, updateAdmin, userUid])

  return (
    <section className='flex h-[90lvh] min-w-0 w-full max-w-full flex-col gap-4 overflow-y-auto pb-32'>
      <ContentHeader title={title}>
        <Button
          size='sm'
          isIconOnly
          variant='primary'
          onPress={handleSave}
          isDisabled={isSaving || !configLoaded || !userUid}
          className='bg-foreground size-5.5'>
          <Icon name='plus' className='size-4 m-auto dark:text-dark-table' />
        </Button>
      </ContentHeader>

      <div className='grid md:grid-cols-3 gap-3 w-full px-2'>
        <div
          className={cn('rounded-md border border-default-200 p-4 space-y-2', {
            ' dark:bg-dark-table': Boolean(metapixel.trim()),
          })}>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex items-center space-x-2 in-w-0 sm:w-fit'>
              <Icon name='meta' />
              <div className='font-clash text-base opacity-70'>Metapixel</div>
            </div>
            <Toggle
              title='Enabled'
              label={Boolean(metapixel.trim()) ? 'Enabled' : 'Disabled'}
              checked={Boolean(metapixel.trim())}
              onChange={undefined}
              disabled={!configLoaded}
            />
          </div>
          <Input
            label='Dataset Id'
            placeholder={'1499203201936284'}
            value={metapixel}
            onChange={handleChangeId}
            disabled={!configLoaded}
          />
        </div>
      </div>
    </section>
  )
}
