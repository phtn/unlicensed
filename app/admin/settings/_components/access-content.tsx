'use client'

import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Input} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useRef, useState, ViewTransition} from 'react'
import {commonInputClassNames} from '../../_components/ui/fields'

function getPassesFromHaltPass(
  haltPass: {value?: {value?: unknown}} | null | undefined,
): string[] {
  const v = haltPass?.value?.value
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export const AccessContent = () => {
  const {user} = useAuthCtx()
  const haltPass = useQuery(api.admin.q.getHaltPass)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const [passes, setPasses] = useState<string[]>([])
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
    const serverPasses = getPassesFromHaltPass(haltPass ?? null)
    const key = JSON.stringify(serverPasses)
    if (key !== lastSyncedRef.current) {
      lastSyncedRef.current = key
      setPasses(serverPasses)
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
        value: {value: trimmed},
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
  }, [passes, updateAdmin, user?.uid])

  const isLoading = haltPass === undefined

  if (isLoading) {
    return (
      <div className='flex w-full flex-col gap-4'>
        <SectionHeader title='Access (Halt Pass)' />
        <p className='text-sm text-foreground/60'>Loading…</p>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <SectionHeader
        title='Access (Halt Gate)'
        description='PIN codes that grant access to the store. 6 characters. Not case-sensitive.'>
        <Button
          size='sm'
          color='primary'
          onPress={handleSave}
          className='bg-dark-table dark:bg-white dark:text-dark-table'
          isLoading={isSaving}>
          Save Changes
        </Button>
      </SectionHeader>

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
                size='sm'
                placeholder='PIN code'
                classNames={commonInputClassNames}
                maxLength={6}
                minLength={6}
                value={pass}
                onValueChange={(s) => handlePassChange(index, s)}
                spellCheck={'false'}
                autoComplete='false'
                autoCorrect='false'
                className='min-w-0 flex-1'
                aria-label={`Pass ${index + 1}`}
              />
              <Button
                isIconOnly
                size='sm'
                variant='light'
                color='danger'
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
        <Button
          size='sm'
          variant='bordered'
          onPress={handleAdd}
          startContent={<Icon name='plus' className='size-4' />}>
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
