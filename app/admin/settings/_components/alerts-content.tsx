'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {
  ADMIN_ALERT_EVENT_KEYS,
  ADMIN_ALERTS_IDENTIFIER,
  type AdminAlertEventConfig,
  type AdminAlertEventKey,
  type AdminAlertsConfig,
  ALERT_SYNTH_TYPES,
  normalizeAdminAlertsConfig,
  notesToInputValue,
  parseNotesInput,
  playAdminAlert,
  serializeAdminAlertsConfig,
  TONE_OSCILLATORS,
} from '@/lib/admin-alerts'
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Switch,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useEffect, useMemo, useState} from 'react'
import {ContentHeader, PrimaryButton} from './components'

const ALERT_LABELS: Record<AdminAlertEventKey, string> = {
  orders: 'New Orders',
  payments: 'Payments',
  signups: 'User Sign-ups',
  messages: 'Customer Chat',
}

type AlertDraftMap = Record<
  AdminAlertEventKey,
  {
    notesInput: string
    synthType: AdminAlertEventConfig['synthType']
    waveform: AdminAlertEventConfig['waveform']
    noteDurationMs: string
    gapMs: string
    volumeDb: string
    enabled: boolean
  }
>

const buildDrafts = (config: AdminAlertsConfig): AlertDraftMap => ({
  orders: {
    enabled: config.orders.enabled,
    synthType: config.orders.synthType,
    waveform: config.orders.waveform,
    notesInput: notesToInputValue(config.orders.notes),
    noteDurationMs: String(config.orders.noteDurationMs),
    gapMs: String(config.orders.gapMs),
    volumeDb: String(config.orders.volumeDb),
  },
  payments: {
    enabled: config.payments.enabled,
    synthType: config.payments.synthType,
    waveform: config.payments.waveform,
    notesInput: notesToInputValue(config.payments.notes),
    noteDurationMs: String(config.payments.noteDurationMs),
    gapMs: String(config.payments.gapMs),
    volumeDb: String(config.payments.volumeDb),
  },
  signups: {
    enabled: config.signups.enabled,
    synthType: config.signups.synthType,
    waveform: config.signups.waveform,
    notesInput: notesToInputValue(config.signups.notes),
    noteDurationMs: String(config.signups.noteDurationMs),
    gapMs: String(config.signups.gapMs),
    volumeDb: String(config.signups.volumeDb),
  },
  messages: {
    enabled: config.messages.enabled,
    synthType: config.messages.synthType,
    waveform: config.messages.waveform,
    notesInput: notesToInputValue(config.messages.notes),
    noteDurationMs: String(config.messages.noteDurationMs),
    gapMs: String(config.messages.gapMs),
    volumeDb: String(config.messages.volumeDb),
  },
})

const parseNumberInput = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const AlertsContent = () => {
  const {user} = useAuthCtx()
  const alertsSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: ADMIN_ALERTS_IDENTIFIER,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const config = useMemo(
    () => normalizeAdminAlertsConfig(alertsSetting?.value),
    [alertsSetting?.value],
  )
  const [isEnabled, setIsEnabled] = useState(config.enabled)
  const [drafts, setDrafts] = useState<AlertDraftMap>(() => buildDrafts(config))
  const [isSaving, setIsSaving] = useState(false)
  const [testingKey, setTestingKey] = useState<AdminAlertEventKey | null>(null)

  useEffect(() => {
    setIsEnabled(config.enabled)
    setDrafts(buildDrafts(config))
  }, [config])

  const normalizedDraftConfig = useMemo<AdminAlertsConfig>(() => {
    return normalizeAdminAlertsConfig({
      enabled: isEnabled,
      orders: {
        enabled: drafts.orders.enabled,
        synthType: drafts.orders.synthType,
        waveform: drafts.orders.waveform,
        notes: parseNotesInput(drafts.orders.notesInput),
        noteDurationMs: parseNumberInput(
          drafts.orders.noteDurationMs,
          config.orders.noteDurationMs,
        ),
        gapMs: parseNumberInput(drafts.orders.gapMs, config.orders.gapMs),
        volumeDb: parseNumberInput(
          drafts.orders.volumeDb,
          config.orders.volumeDb,
        ),
      },
      payments: {
        enabled: drafts.payments.enabled,
        synthType: drafts.payments.synthType,
        waveform: drafts.payments.waveform,
        notes: parseNotesInput(drafts.payments.notesInput),
        noteDurationMs: parseNumberInput(
          drafts.payments.noteDurationMs,
          config.payments.noteDurationMs,
        ),
        gapMs: parseNumberInput(drafts.payments.gapMs, config.payments.gapMs),
        volumeDb: parseNumberInput(
          drafts.payments.volumeDb,
          config.payments.volumeDb,
        ),
      },
      signups: {
        enabled: drafts.signups.enabled,
        synthType: drafts.signups.synthType,
        waveform: drafts.signups.waveform,
        notes: parseNotesInput(drafts.signups.notesInput),
        noteDurationMs: parseNumberInput(
          drafts.signups.noteDurationMs,
          config.signups.noteDurationMs,
        ),
        gapMs: parseNumberInput(drafts.signups.gapMs, config.signups.gapMs),
        volumeDb: parseNumberInput(
          drafts.signups.volumeDb,
          config.signups.volumeDb,
        ),
      },
      messages: {
        enabled: drafts.messages.enabled,
        synthType: drafts.messages.synthType,
        waveform: drafts.messages.waveform,
        notes: parseNotesInput(drafts.messages.notesInput),
        noteDurationMs: parseNumberInput(
          drafts.messages.noteDurationMs,
          config.messages.noteDurationMs,
        ),
        gapMs: parseNumberInput(drafts.messages.gapMs, config.messages.gapMs),
        volumeDb: parseNumberInput(
          drafts.messages.volumeDb,
          config.messages.volumeDb,
        ),
      },
    })
  }, [
    config.messages.gapMs,
    config.messages.noteDurationMs,
    config.messages.volumeDb,
    config.orders.gapMs,
    config.orders.noteDurationMs,
    config.orders.volumeDb,
    config.payments.gapMs,
    config.payments.noteDurationMs,
    config.payments.volumeDb,
    config.signups.gapMs,
    config.signups.noteDurationMs,
    config.signups.volumeDb,
    drafts,
    isEnabled,
  ])

  const isDirty =
    JSON.stringify(serializeAdminAlertsConfig(normalizedDraftConfig)) !==
    JSON.stringify(serializeAdminAlertsConfig(config))

  const setDraftField = useCallback(
    <T extends keyof AlertDraftMap[AdminAlertEventKey]>(
      key: AdminAlertEventKey,
      field: T,
      value: AlertDraftMap[AdminAlertEventKey][T],
    ) => {
      setDrafts((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
        },
      }))
    },
    [],
  )

  const handleSave = useCallback(() => {
    if (!user?.uid) return
    setIsSaving(true)
    startTransition(() => {
      updateAdmin({
        identifier: ADMIN_ALERTS_IDENTIFIER,
        value: serializeAdminAlertsConfig(normalizedDraftConfig),
        uid: user.uid,
      })
        .then(() => {
          onSuccess('Alert settings saved')
          setIsSaving(false)
        })
        .catch((error) => {
          onError(
            error instanceof Error ? error.message : 'Failed to save alerts',
          )
          setIsSaving(false)
        })
    })
  }, [normalizedDraftConfig, updateAdmin, user?.uid])

  const handleTest = useCallback(
    async (key: AdminAlertEventKey) => {
      try {
        setTestingKey(key)
        await playAdminAlert(normalizedDraftConfig[key])
      } catch (error) {
        onError(
          error instanceof Error
            ? error.message
            : 'Unable to start audio. Interact with the page and try again.',
        )
      } finally {
        window.setTimeout(() => setTestingKey(null), 300)
      }
    },
    [normalizedDraftConfig],
  )

  return (
    <div className='flex w-full flex-col gap-4 h-[90vh] md:w-[82lvw] overflow-scroll pb-24'>
      <ContentHeader
        title={
          <div className='flex items-center space-x-4'>
            <span>Admin Alerts</span>
            <Switch
              isSelected={isEnabled}
              onValueChange={setIsEnabled}
              size='sm'>
              Enable Audio
            </Switch>
          </div>
        }
        description='Configure Tone.js audio alerts for new orders, completed payments, new user sign-ups, and new customer chat messages.'>
        <PrimaryButton
          onPress={handleSave}
          icon={isSaving ? 'spinners-ring' : 'save'}
          label='Save Changes'
          disabled={!user?.uid || isSaving || !isDirty}
        />
      </ContentHeader>

      <div className='grid gap-4 xl:grid-cols-4'>
        {ADMIN_ALERT_EVENT_KEYS.map((key) => {
          const draft = drafts[key]

          return (
            <Card
              key={key}
              shadow='none'
              className='rounded-2xl border border-divider bg-default-100/30'>
              <CardBody className='gap-4 p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h3 className='text-base font-semibold'>
                    {ALERT_LABELS[key]}
                  </h3>
                  <Switch
                    isSelected={draft.enabled}
                    onValueChange={(value) =>
                      setDraftField(key, 'enabled', value)
                    }
                    size='sm'>
                    On
                  </Switch>
                </div>

                <Input
                  label='Notes'
                  value={draft.notesInput}
                  onValueChange={(value) =>
                    setDraftField(key, 'notesInput', value)
                  }
                  placeholder='C5, E5, G5'
                  description='Comma-separated Tone.js note names.'
                  classNames={commonInputClassNames}
                />

                <Select
                  label='Synth'
                  labelPlacement='outside'
                  selectedKeys={[draft.synthType]}
                  onSelectionChange={(keys) => {
                    const next = Array.from(keys)[0]
                    if (typeof next === 'string') {
                      setDraftField(
                        key,
                        'synthType',
                        next as AdminAlertEventConfig['synthType'],
                      )
                    }
                  }}>
                  {ALERT_SYNTH_TYPES.map((synthType) => (
                    <SelectItem key={synthType}>{synthType}</SelectItem>
                  ))}
                </Select>

                {draft.synthType === 'basic' && (
                  <Select
                    label='Waveform'
                    labelPlacement='outside'
                    selectedKeys={[draft.waveform]}
                    onSelectionChange={(keys) => {
                      const next = Array.from(keys)[0]
                      if (typeof next === 'string') {
                        setDraftField(
                          key,
                          'waveform',
                          next as AdminAlertEventConfig['waveform'],
                        )
                      }
                    }}>
                    {TONE_OSCILLATORS.map((waveform) => (
                      <SelectItem key={waveform}>{waveform}</SelectItem>
                    ))}
                  </Select>
                )}

                <div className='grid grid-cols-3 gap-3'>
                  <Input
                    type='number'
                    label='Note ms'
                    value={draft.noteDurationMs}
                    onValueChange={(value) =>
                      setDraftField(key, 'noteDurationMs', value)
                    }
                    classNames={commonInputClassNames}
                  />
                  <Input
                    type='number'
                    label='Gap ms'
                    value={draft.gapMs}
                    onValueChange={(value) =>
                      setDraftField(key, 'gapMs', value)
                    }
                    classNames={commonInputClassNames}
                  />
                  <Input
                    type='number'
                    label='Volume dB'
                    value={draft.volumeDb}
                    onValueChange={(value) =>
                      setDraftField(key, 'volumeDb', value)
                    }
                    classNames={commonInputClassNames}
                  />
                </div>

                <Button
                  variant='flat'
                  onPress={() => void handleTest(key)}
                  isDisabled={!isEnabled || !draft.enabled}
                  isLoading={testingKey === key}>
                  Test {ALERT_LABELS[key]}
                </Button>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
