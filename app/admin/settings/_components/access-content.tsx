'use client'

import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {
  canAddMasterMonitorEntries,
  canDisableMasterMonitorEntry,
  canManageMasterMonitor,
  canRetagMasterMonitorEntries,
  DEFAULT_OG_MASTER_EMAIL,
  getMasterMonitorEntries,
  getMasterRosterChangeAuthorization,
  getMasterTypeForEmail,
  MASTER_MONITOR_IDENTIFIER,
  MASTER_TYPES,
  serializeMasterMonitorEntries,
  type MasterEntry,
  type MasterType,
} from '@/lib/master-monitor-access'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import {Toggle} from '../../_components/ui/toggle'
import {ContentHeader, LoadingHeader, PrimaryButton} from './components'

type EditableMasterEntry = MasterEntry & {
  id: string
  locked?: boolean
}

function allocateRowId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `master-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function toEditableMasterEntry(entry: MasterEntry): EditableMasterEntry {
  return {
    id: allocateRowId(),
    ...entry,
    locked: entry.email === DEFAULT_OG_MASTER_EMAIL && entry.type === 'OG',
  }
}

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

async function saveMasterEntriesRequest({
  masters,
  idToken,
}: {
  masters: MasterEntry[]
  idToken: string
}) {
  const response = await fetch('/api/admin/master-monitor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({masters}),
  })

  const payload = (await response.json().catch(() => null)) as {
    error?: string
    masters?: MasterEntry[]
  } | null

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to save master monitor access.')
  }

  return payload?.masters ?? []
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
  const [masterRows, setMasterRows] = useState<EditableMasterEntry[]>([])
  const [isSavingGate, setIsSavingGate] = useState(false)
  const [isSavingMasters, setIsSavingMasters] = useState(false)
  const [gateSaveStatus, setGateSaveStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [masterSaveStatus, setMasterSaveStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')

  const gateSaveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const masterSaveStatusTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const lastSyncedRef = useRef<string>('')
  const lastMasterSyncRef = useRef<string>('')

  const isLoading = haltPass === undefined || masterMonitorSetting === undefined
  const isMobile = useMobile()
  const persistedMasterEntries = useMemo(
    () => getMasterMonitorEntries(masterMonitorSetting ?? null),
    [masterMonitorSetting],
  )
  const currentMasterType = useMemo(
    () => getMasterTypeForEmail(user?.email, persistedMasterEntries),
    [persistedMasterEntries, user?.email],
  )
  const isDefaultOgMaster = canManageMasterMonitor(user?.email)
  const canAddMasters = canAddMasterMonitorEntries(user?.email)
  const canRetagMasters = canRetagMasterMonitorEntries(user?.email)
  const canSaveMasterChanges =
    isDefaultOgMaster ||
    currentMasterType === 'OG' ||
    currentMasterType === 'TOP-G'
  const nextMasterEntries = useMemo(
    () =>
      getMasterMonitorEntries({
        value: {
          masters: serializeMasterMonitorEntries(
            masterRows.map(({email, type}) => ({email, type})),
          ),
        },
      }),
    [masterRows],
  )
  const masterChangeAuthorization = useMemo(
    () =>
      getMasterRosterChangeAuthorization({
        actorEmail: user?.email,
        currentEntries: persistedMasterEntries,
        nextEntries: nextMasterEntries,
      }),
    [nextMasterEntries, persistedMasterEntries, user?.email],
  )
  const hasPendingMasterChanges =
    masterChangeAuthorization.change.added.length > 0 ||
    masterChangeAuthorization.change.removed.length > 0 ||
    masterChangeAuthorization.change.retagged.length > 0
  const masterPermissionDescription = isDefaultOgMaster
    ? 'You are the default OG. You can add, retag, or disable any non-default master.'
    : currentMasterType === 'OG'
      ? 'OG can disable TOP-G and SB. Adding and retagging stay locked to the default OG.'
      : currentMasterType === 'TOP-G'
        ? 'TOP-G can disable SB only and has no power over OG.'
        : 'SB is read-only and has no power over the G tiers.'

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

    const nextEntries = getMasterMonitorEntries(masterMonitorSetting ?? null)
    const key = JSON.stringify(nextEntries)
    if (key !== lastMasterSyncRef.current) {
      lastMasterSyncRef.current = key
      setMasterRows(nextEntries.map((entry) => toEditableMasterEntry(entry)))
    }
  }, [masterMonitorSetting])

  useEffect(
    () => () => {
      if (gateSaveStatusTimeoutRef.current) {
        clearTimeout(gateSaveStatusTimeoutRef.current)
      }
      if (masterSaveStatusTimeoutRef.current) {
        clearTimeout(masterSaveStatusTimeoutRef.current)
      }
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

  const handleAddPass = useCallback(() => {
    setPasses((prev) => [...prev, ''])
  }, [])

  const handleDeletePass = useCallback((index: number) => {
    setPasses((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleMasterEmailChange = useCallback((id: string, value: string) => {
    setMasterRows((prev) =>
      prev.map((row) => (row.id === id ? {...row, email: value} : row)),
    )
  }, [])

  const handleMasterTypeChange = useCallback((id: string, value: string) => {
    setMasterRows((prev) =>
      prev.map((row) =>
        row.id === id ? {...row, type: value as MasterType} : row,
      ),
    )
  }, [])

  const handleAddMaster = useCallback(() => {
    if (!canAddMasters) return

    setMasterRows((prev) => [
      ...prev,
      toEditableMasterEntry({email: '', type: 'SB'}),
    ])
  }, [canAddMasters])

  const handleDeleteMaster = useCallback((id: string) => {
    setMasterRows((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const handleSaveGate = useCallback(async () => {
    const trimmed = passes.map((p) => p.trim()).filter((p) => p.length > 0)
    setIsSavingGate(true)
    setGateSaveStatus('idle')

    try {
      await updateAdmin({
        identifier: 'halt-pass',
        value: {value: trimmed, enabled: isEnabled},
        uid: user?.uid ?? 'anonymous',
      })
      setPasses(trimmed)
      setGateSaveStatus('success')
      if (gateSaveStatusTimeoutRef.current) {
        clearTimeout(gateSaveStatusTimeoutRef.current)
      }
      gateSaveStatusTimeoutRef.current = setTimeout(
        () => setGateSaveStatus('idle'),
        3000,
      )
    } catch {
      setGateSaveStatus('error')
      if (gateSaveStatusTimeoutRef.current) {
        clearTimeout(gateSaveStatusTimeoutRef.current)
      }
      gateSaveStatusTimeoutRef.current = setTimeout(
        () => setGateSaveStatus('idle'),
        3000,
      )
    } finally {
      setIsSavingGate(false)
    }
  }, [isEnabled, passes, updateAdmin, user?.uid])

  const handleSaveMasters = useCallback(async () => {
    if (
      !user ||
      !canSaveMasterChanges ||
      !hasPendingMasterChanges ||
      !masterChangeAuthorization.allowed
    ) {
      setMasterSaveStatus('error')
      return
    }

    setIsSavingMasters(true)
    setMasterSaveStatus('idle')

    try {
      const idToken = await user.getIdToken()
      const normalizedMasters = serializeMasterMonitorEntries(
        masterRows.map(({email, type}) => ({email, type})),
      )
      const savedMasters = await saveMasterEntriesRequest({
        masters: normalizedMasters,
        idToken,
      })

      setMasterRows(savedMasters.map((entry) => toEditableMasterEntry(entry)))
      setMasterSaveStatus('success')
      if (masterSaveStatusTimeoutRef.current) {
        clearTimeout(masterSaveStatusTimeoutRef.current)
      }
      masterSaveStatusTimeoutRef.current = setTimeout(
        () => setMasterSaveStatus('idle'),
        3000,
      )
    } catch {
      setMasterSaveStatus('error')
      if (masterSaveStatusTimeoutRef.current) {
        clearTimeout(masterSaveStatusTimeoutRef.current)
      }
      masterSaveStatusTimeoutRef.current = setTimeout(
        () => setMasterSaveStatus('idle'),
        3000,
      )
    } finally {
      setIsSavingMasters(false)
    }
  }, [
    canSaveMasterChanges,
    hasPendingMasterChanges,
    masterChangeAuthorization.allowed,
    masterRows,
    user,
  ])

  if (isLoading) {
    return <LoadingHeader title='Access' />
  }

  return (
    <div className='flex flex-col gap-4'>
      <ContentHeader
        title='Access Code'
        description='Manage the store gate and the master-monitor roster.'
      />

      <div className='grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]'>
        <section className='flex flex-col gap-4'>
          <div className='flex items-center space-x-32 px-2'>
            <Toggle
              label='Require access code'
              title='Require access code'
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                size='sm'
                variant='primary'
                onPress={handleAddPass}
                className='bg-light-brand h-7 rounded-md'>
                <Icon name='plus' className='size-4 m-auto' />
                Add
              </Button>
              <PrimaryButton
                isMobile={isMobile}
                onPress={handleSaveGate}
                label='Save Gate'
                disabled={isSavingGate}
                icon={isSavingGate ? 'spinners-ring' : 'save'}
              />
              {gateSaveStatus === 'success' && (
                <span className='text-sm text-success'>Gate saved</span>
              )}
              {gateSaveStatus === 'error' && (
                <span className='text-sm text-danger'>Failed to save gate</span>
              )}
            </div>
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
                    withAction>
                    <Icon
                      name='trash'
                      aria-label={`Delete pass ${index + 1}`}
                      onClick={() => handleDeletePass(index)}
                      className='size-4 dark:text-white'
                    />
                  </Input>
                </li>
              </ViewTransition>
            ))}
          </ul>
        </section>

        <section className='hidden _flex flex-col gap-4'>
          <div className='rounded-2xl bg-default-100/50 px-4 py-4 dark:bg-default-100/30'>
            <div className='space-y-1'>
              <h3 className='text-sm font-medium uppercase tracking-wider text-foreground/70'>
                Master Monitor Access
              </h3>
              <p className='text-sm text-muted-foreground'>
                Only{' '}
                <span className='font-medium'>{DEFAULT_OG_MASTER_EMAIL}</span>{' '}
                can add or retag masters. {masterPermissionDescription} Access
                still requires the account to be an active staff member.
              </p>
            </div>

            <div className='mt-4 flex flex-col gap-2'>
              {masterRows.map((row) =>
                (() => {
                  const canDisableRow = canDisableMasterMonitorEntry({
                    actorEmail: user?.email,
                    target: {email: row.email, type: row.type},
                    entries: persistedMasterEntries,
                  })

                  return (
                    <div
                      key={row.id}
                      className='grid gap-2 rounded-2xl border border-border/60 bg-background/70 p-3 md:grid-cols-[minmax(0,1fr)_8rem_auto]'>
                      <div className='min-w-0'>
                        <label className='mb-1 block text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase'>
                          Email
                        </label>
                        <input
                          type='email'
                          value={row.email}
                          onChange={(event) =>
                            handleMasterEmailChange(row.id, event.target.value)
                          }
                          disabled={!canRetagMasters || row.locked}
                          className='h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70'
                          placeholder='staff@example.com'
                        />
                      </div>

                      <div>
                        <label className='mb-1 block text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase'>
                          Type
                        </label>
                        <select
                          value={row.type}
                          onChange={(event) =>
                            handleMasterTypeChange(row.id, event.target.value)
                          }
                          disabled={!canRetagMasters || row.locked}
                          className='h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-70'>
                          {MASTER_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className='flex items-end gap-2'>
                        {row.locked ? (
                          <span className='inline-flex h-10 items-center rounded-md border border-brand/30 bg-brand/10 px-3 text-xs font-medium text-brand'>
                            Default OG
                          </span>
                        ) : canDisableRow ? (
                          <Button
                            isIconOnly
                            size='sm'
                            variant='danger'
                            onPress={() => handleDeleteMaster(row.id)}
                            isDisabled={!canSaveMasterChanges}
                            className='mt-auto size-10 rounded-md'
                            aria-label={`Disable ${row.email || 'master'}`}>
                            <Icon
                              name='trash'
                              className='size-4 dark:text-white'
                            />
                          </Button>
                        ) : (
                          <span className='inline-flex h-10 items-center rounded-md border border-border/60 bg-muted/50 px-3 text-xs font-medium text-muted-foreground'>
                            Protected
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })(),
              )}
            </div>

            <div className='mt-4 flex flex-wrap items-center gap-3'>
              <Button
                size='sm'
                variant='primary'
                onPress={handleAddMaster}
                isDisabled={!canAddMasters}
                className='bg-light-brand'>
                <Icon name='plus' className='size-4 m-auto' />
                Add Master
              </Button>
              <PrimaryButton
                isMobile={isMobile}
                onPress={handleSaveMasters}
                label='Save Masters'
                disabled={
                  isSavingMasters ||
                  !canSaveMasterChanges ||
                  !hasPendingMasterChanges ||
                  !masterChangeAuthorization.allowed
                }
                icon={isSavingMasters ? 'spinners-ring' : 'save'}
              />
              {masterSaveStatus === 'success' && (
                <span className='text-sm text-success'>Masters saved</span>
              )}
              {masterSaveStatus === 'error' && (
                <span className='text-sm text-danger'>
                  Failed to save masters
                </span>
              )}
            </div>

            {!canSaveMasterChanges ? (
              <p className='mt-3 text-sm text-muted-foreground'>
                You can view the roster, but you do not have permission to
                change it.
              </p>
            ) : null}

            {hasPendingMasterChanges && !masterChangeAuthorization.allowed ? (
              <p className='mt-3 text-sm text-danger'>
                {masterChangeAuthorization.reason}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
