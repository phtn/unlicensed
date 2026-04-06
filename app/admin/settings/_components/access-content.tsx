'use client'

import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useRef, useState, ViewTransition} from 'react'
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
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const [passes, setPasses] = useState<string[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const lastSyncedRef = useRef<string>('')

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
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      await updateAdmin({
        identifier: 'halt-pass',
        value: {value: trimmed, enabled: isEnabled},
        uid: user?.uid ?? 'anonymous',
      })
      setPasses(trimmed)
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
  }, [isEnabled, passes, updateAdmin, user?.uid])

  const isLoading = haltPass === undefined
  const isMobile = useMobile()

  if (isLoading) {
    return <LoadingHeader title='Access (Halt Gate)' />
  }

  return (
    <div className='flex flex-col gap-4'>
      <ContentHeader
        title='Access (Halt Gate)'
        description='PIN codes that grant access to the store. Disable this to bypass the gate and route visitors directly to /lobby.'>
        <PrimaryButton
          isMobile={isMobile}
          onPress={handleSave}
          label='Save Changes'
          disabled={isSaving}
          icon={isSaving ? 'spinners-ring' : 'save'}
        />
      </ContentHeader>

      <div className='max-w-lg rounded-2xl bg-default-100/50 px-4 py-3 dark:bg-default-100/30'>
        <Switch
          isSelected={isEnabled}
          onChange={() => setIsEnabled(!isEnabled)}
          size='sm'>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>
            <span>Require access code</span>
          </Switch.Content>
        </Switch>
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
                className='mx-2'
                aria-label={`Delete pass ${index + 1}`}>
                <Icon name='trash' className='size-4 dark:text-white' />
              </Button>
            </li>
          </ViewTransition>
        ))}
      </ul>

      <div className='flex flex-wrap items-center gap-3'>
        <Button size='sm' variant='secondary' onPress={handleAdd}>
          <Icon name='plus' className='size-4' />
          Add Passcode
        </Button>
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
