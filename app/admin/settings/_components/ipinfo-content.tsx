'use client'

import {ContentHeader} from '@/app/admin/settings/_components/components'
import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {
  EMPTY_IPINFO_CONFIG,
  IPINFO_IDENTIFIER,
  IPINFO_SERVICES,
  type IpinfoConfig,
  type IpinfoService,
  parseIpinfoConfig,
} from '@/lib/ipinfo/config'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useEffect, useMemo, useState} from 'react'
import {Toggle} from '../../_components/ui/toggle'

const SERVICE_METADATA: Record<
  IpinfoService,
  {label: string; endpoint: string; description: string}
> = {
  lite: {
    label: 'Lite',
    endpoint: '/lite',
    description: 'Country and ASN details with the Lite endpoint.',
  },
  core: {
    label: 'Core',
    endpoint: '/lookup',
    description: 'City-level geolocation and network flags.',
  },
  plus: {
    label: 'Plus',
    endpoint: '/lookup',
    description: 'Lookup API with carrier, privacy, and change metadata.',
  },
  max: {
    label: 'Max',
    endpoint: '/lookup',
    description:
      'Lookup API with full anonymization and residential proxy signals.',
  },
}

export const IpInfoContent = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: IPINFO_IDENTIFIER,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const initialConfig = useMemo(
    () => parseIpinfoConfig(setting?.value),
    [setting],
  )
  const configKey =
    setting === undefined ? 'loading' : JSON.stringify(initialConfig)

  return (
    <div className='flex w-full flex-col gap-4'>
      <FormInner
        key={configKey}
        title='IP Info Configuration'
        initialConfig={initialConfig}
        configLoaded={setting !== undefined}
        updateAdmin={updateAdmin}
        userUid={user?.uid}
      />
    </div>
  )
}

function FormInner({
  title,
  initialConfig,
  configLoaded,
  updateAdmin,
  userUid,
}: {
  title: string
  initialConfig: IpinfoConfig
  configLoaded: boolean
  updateAdmin: (args: {
    identifier: string
    value: Record<string, unknown>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const [config, setConfig] = useState<IpinfoConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  useEffect(() => {
    if (saveMessage && saveMessage === 'saved') {
      onSuccess('IP Info settings saved')
    }
  }, [saveMessage])

  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  const handleTokenChange = useCallback(
    (service: IpinfoService, token: string) => {
      setConfig((current) => ({
        ...current,
        [service]: {token},
      }))
    },
    [],
  )

  const handleEnabledServiceChange = useCallback(
    (service: IpinfoService, checked: boolean) => {
      if (!checked) {
        return
      }

      setConfig((current) => ({
        ...current,
        enabledService: service,
      }))
    },
    [],
  )

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setSaveMessage(null)

    startTransition(() => {
      updateAdmin({
        identifier: IPINFO_IDENTIFIER,
        value: {
          enabledService: config.enabledService,
          ...Object.fromEntries(
            IPINFO_SERVICES.map((service) => [
              service,
              {token: config[service].token.trim()},
            ]),
          ),
        },
        uid: userUid ?? 'anonymous',
      })
        .then(() => {
          setSaveMessage('saved')
          setTimeout(() => setSaveMessage(null), 2000)
        })
        .catch(() => setSaveMessage('error'))
        .finally(() => setIsSaving(false))
    })
  }, [config, updateAdmin, userUid])

  const enabledToken =
    config[config.enabledService]?.token.trim() ||
    EMPTY_IPINFO_CONFIG.lite.token

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
          <Icon name='check' className='size-4 m-auto dark:text-dark-table' />
        </Button>
      </ContentHeader>

      <div className='grid md:grid-cols-2 gap-3 w-full md:px-2'>
        {IPINFO_SERVICES.map((service) => (
          <div
            key={service}
            className={cn('rounded-md border border-sidebar/50 p-4 space-y-3', {
              'dark:bg-dark-table dark:border-dark-table':
                SERVICE_METADATA[config.enabledService].label.toLowerCase() ===
                service,
            })}>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div className='min-w-0 space-y-2 sm:w-fit'>
                <div className='flex items-center space-x-3 font-clash text-foreground/80 text-base'>
                  <Icon name='ipinfo' className='size-5' />
                  <span>IP Info {SERVICE_METADATA[service].label}</span>
                  <span className='font-mono font-light text-xs opacity-70'>
                    {SERVICE_METADATA[service].endpoint}
                  </span>
                </div>

                <div className='text-sm text-muted-foreground'>
                  {SERVICE_METADATA[service].description}
                </div>
              </div>
              <Toggle
                title={`Enable ${SERVICE_METADATA[service].label}`}
                label='Enabled'
                checked={config.enabledService === service}
                onChange={(checked) =>
                  handleEnabledServiceChange(service, checked)
                }
                disabled={!configLoaded}
              />
            </div>
            <Input
              label={`${SERVICE_METADATA[service].label} token`}
              placeholder='ipinfo token'
              value={config[service].token}
              onChange={(e) => handleTokenChange(service, e.target.value)}
              disabled={!configLoaded}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
