'use client'

import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {
  getMasterMonitorEmails,
  MASTER_MONITOR_IDENTIFIER,
  parseMasterMonitorEmails,
} from '@/lib/master-monitor-access'
import {cn} from '@/lib/utils'
import {Button, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useRef, useState, ViewTransition} from 'react'
import {Toggle} from '../../_components/ui/toggle'
import {ContentHeader, LoadingHeader, PrimaryButton} from './components'

function getHaltPassConfig(
  haltPass:
    | {
        value?: {
          value?: unknown
          enabled?: unknown
        }
      }
    | null
    | undefined,
): {passes: string[]; enabled: boolean} {
  const v = haltPass?.value?.value
  return {
    passes: Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string')
      : [],
    enabled: haltPass?.value?.enabled !== false,
  }
}

export const AccessContent = () => {
  const {user} = useAuthCtx()
  const haltPass = useQuery(api.admin.q.getHaltPass)
  const masterMonitorSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: MASTER_MONITOR_IDENTIFIER,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const [passes, setPasses] = useState<string[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [masterEmailInput, setMasterEmailInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const lastSyncedRef = useRef<string>('')
  const lastMasterSyncRef = useRef<string>('')

  // Sync from server when haltPass loads/changes (subscription to external system)
  useEffect(() => {
    if (haltPass === undefined) return
    const config = getHaltPassConfig(haltPass ?? null)
    const key = JSON.stringify(config)
    if (key !== lastSyncedRef.current) {
      lastSyncedRef.current = key
      setPasses(config.passes)
      setIsEnabled(config.enabled)
    }
  }, [haltPass])

  useEffect(() => {
    if (masterMonitorSetting === undefined) return

    const nextEmails = getMasterMonitorEmails(masterMonitorSetting ?? null)
    const nextValue = nextEmails.join('\n')

    if (nextValue !== lastMasterSyncRef.current) {
      lastMasterSyncRef.current = nextValue
      setMasterEmailInput(nextValue)
    }
  }, [masterMonitorSetting])

  useEffect(
    () => () => {
      if (saveStatusTimeoutRef.current)
        clearTimeout(saveStatusTimeoutRef.current)
    },
    [],
  )

  const handlePassChange = useCallback((index: number, value: string) => {
    setPasses((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  const handleAdd = useCallback(() => {
    setPasses((prev) => [...prev, ''])
  }, [])

  const handleDelete = useCallback((index: number) => {
    setPasses((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(async () => {
    const trimmed = passes.map((p) => p.trim()).filter((p) => p.length > 0)
    const masterEmails = parseMasterMonitorEmails(masterEmailInput)
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      await Promise.all([
        updateAdmin({
          identifier: 'halt-pass',
          value: {value: trimmed, enabled: isEnabled},
          uid: user?.uid ?? 'anonymous',
        }),
        updateAdmin({
          identifier: MASTER_MONITOR_IDENTIFIER,
          value: {emails: masterEmails},
          uid: user?.uid ?? 'anonymous',
        }),
      ])
      setPasses(trimmed)
      setMasterEmailInput(masterEmails.join('\n'))
      setSaveStatus('success')
      if (saveStatusTimeoutRef.current)
        clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = setTimeout(
        () => setSaveStatus('idle'),
        3000,
      )
    } catch {
      setSaveStatus('error')
      if (saveStatusTimeoutRef.current)
        clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = setTimeout(
        () => setSaveStatus('idle'),
        3000,
      )
    } finally {
      setIsSaving(false)
    }
  }, [isEnabled, masterEmailInput, passes, updateAdmin, user?.uid])

  const isLoading = haltPass === undefined || masterMonitorSetting === undefined
  const isMobile = useMobile()
  const parsedMasterEmails = parseMasterMonitorEmails(masterEmailInput)

  if (isLoading) {
    return <LoadingHeader title='Access' />
  }

  return (
    <div className='flex flex-col gap-4'>
      <ContentHeader
        title='Access'
        description='Manage the store gate PINs and the master-monitor email allowlist from one place.'>
        <PrimaryButton
          isMobile={isMobile}
          onPress={handleSave}
          label='Save Changes'
          disabled={isSaving}
          icon={isSaving ? 'spinners-ring' : 'save'}
        />
      </ContentHeader>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
        <section className='flex flex-col gap-4'>
          <div className='rounded-2xl bg-default-100/50 px-4 py-3 dark:bg-default-100/30'>
            <Toggle
              title='Require access code'
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
          </div>

          <ul className='flex flex-col gap-2 max-w-lg' role='list'>
            {passes.map((pass, index) => (
              <ViewTransition key={index}>
                <li
                  className={cn(
                    'flex items-center gap-2 rounded-2xl bg-default-100/50 transition-colors dark:bg-default-100/30',
                    'hover:border-border/80 dark:hover:border-border/60',
                  )}
                  role='listitem'>
                  <Input
                    label={`Pass Code ${index + 1}`}
                    placeholder='PIN code'
                    maxLength={6}
                    minLength={6}
                    value={pass}
                    onChange={(e) => handlePassChange(index, e.target.value)}
                    spellCheck='false'
                    autoComplete='false'
                    autoCorrect='false'
                    aria-label={`Pass ${index + 1}`}
                  />
                  <Button
                    isIconOnly
                    size='sm'
                    variant='danger'
                    onPress={() => handleDelete(index)}
                    className='size-8 aspect-square rounded-md'
                    aria-label={`Delete pass ${index + 1}`}>
                    <Icon name='trash' className='size-4 dark:text-white' />
                  </Button>
                </li>
              </ViewTransition>
            ))}
          </ul>

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              size='sm'
              variant='primary'
              onPress={handleAdd}
              className='bg-light-brand'>
              <Icon name='plus' className='size-4 m-auto' />
              Add Passcode
            </Button>
          </div>
        </section>

        <section className='flex flex-col gap-4'>
          <div className='rounded-2xl bg-default-100/50 px-4 py-4 dark:bg-default-100/30'>
            <div className='space-y-1'>
              <h3 className='text-sm font-medium uppercase tracking-wider text-foreground/70'>
                Master Monitor Access
              </h3>
              <p className='text-sm text-muted-foreground'>
                One email per line. A user can open the master monitor only when
                the account belongs to an active staff member and the email
                below is listed here.
              </p>
            </div>

            <TextArea
              value={masterEmailInput}
              onChange={(event) => setMasterEmailInput(event.target.value)}
              placeholder={'owner@example.com\nops@example.com'}
              rows={8}
              className='mt-4 w-full'
            />

            <div className='mt-3 flex flex-wrap items-center gap-2'>
              {parsedMasterEmails.map((email) => (
                <span
                  key={email}
                  className='rounded-full border border-border/60 bg-background/70 px-2 py-1 text-[11px] font-medium text-foreground/80'>
                  {email}
                </span>
              ))}
              {parsedMasterEmails.length === 0 ? (
                <span className='text-sm text-muted-foreground'>
                  No master emails configured yet.
                </span>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        {saveStatus === 'success' && (
          <span className='text-sm text-success'>Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className='text-sm text-danger'>Failed to save</span>
        )}
      </div>
    </div>
  )
}
