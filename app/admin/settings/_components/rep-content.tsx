'use client'

import {
  commonInputClassNames,
  commonSelectClassNames,
} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {Avatar, Select, SelectItem, Textarea, User} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import React, {
  startTransition,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'
import {LoadingHeader, PrimaryButton} from './components'

type SalesRepValue = {staffId?: string; initialMessageSeed?: string}

export const RepContent = () => {
  const {user} = useAuthCtx()
  const reps = useQuery(api.staff.q.getStaffByPosition, {position: 'Rep'})
  const salesRepSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'sales-rep',
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const settingsValue =
    salesRepSetting?.value && typeof salesRepSetting.value === 'object'
      ? (salesRepSetting.value as SalesRepValue)
      : undefined
  const value = settingsValue?.staffId ?? ''
  const initialMessageSeedValue = settingsValue?.initialMessageSeed ?? ''

  const repOptions = useMemo(() => {
    if (!reps) return []
    return reps
      .filter((r) => r.active)
      .map((r) => ({
        id: r._id,
        label: r.name || r.email || r._id,
        key: r._id,
        avatarUrl: r.avatarUrl,
      }))
  }, [reps])

  // Server value is source of truth; pending* tracks user edits until save
  // null = use server value, '' = user cleared (staffId only), string = user edit
  const [pendingStaffId, setPendingStaffId] = useState<string | null>(null)
  const [pendingInitialMessageSeed, setPendingInitialMessageSeed] = useState<
    string | null
  >(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const displayValue = pendingStaffId !== null ? pendingStaffId : (value ?? '')
  const displayInitialMessage =
    pendingInitialMessageSeed !== null
      ? pendingInitialMessageSeed
      : initialMessageSeedValue
  const selectedKeys = new Set<string>(displayValue ? [displayValue] : [])
  const serverValue = value ?? ''
  const hasStaffChange =
    pendingStaffId !== null && pendingStaffId !== serverValue
  const hasMessageChange =
    pendingInitialMessageSeed !== null &&
    pendingInitialMessageSeed !== initialMessageSeedValue
  const hasChange = hasStaffChange || hasMessageChange

  const handleSelectionChange = useCallback((keys: Set<React.Key> | 'all') => {
    const next = keys === 'all' ? '' : ([...keys].map(String)[0] ?? '')
    setPendingStaffId(next)
  }, [])

  const handleSave = useCallback(() => {
    if (!hasChange) return
    const staffId = displayValue || undefined
    const initialMessageSeed = displayInitialMessage.trim() || undefined
    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: 'sales-rep',
        value: {staffId, initialMessageSeed},
        uid: user?.uid ?? 'anonymous',
      })
        .then(() => {
          setPendingStaffId(null)
          setPendingInitialMessageSeed(null)
          setIsSaving(false)
          setSaveMessage('saved')
          setTimeout(() => setSaveMessage(null), 2000)
        })
        .catch(() => {
          setIsSaving(false)
          setSaveMessage('error')
        })
    })
  }, [hasChange, displayValue, displayInitialMessage, updateAdmin, user?.uid])

  const isLoading = reps === undefined || salesRepSetting === undefined

  if (isLoading) {
    return <LoadingHeader title='Default Sales Rep' />
  }

  return (
    <div className='flex w-full flex-col md:w-[82lvw] space-y-2'>
      <div className='flex items-start w-full min-h-20'>
        <SectionHeader
          title='Default Sales Rep'
          description='Assign default Sales Rep used across the platform. Only staff with Rep position are listed.'>
          <PrimaryButton
            onPress={handleSave}
            label='Save Changes'
            disabled={!hasChange}
            icon={isSaving ? 'spinners-ring' : 'save'}
          />
        </SectionHeader>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <section className='flex flex-col gap-4'>
          <h3 className='text-sm font-medium uppercase tracking-wider text-foreground/70'>
            Select A Rep
          </h3>
          <Select
            items={repOptions}
            label='Sales Rep'
            placeholder='Select a rep'
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) =>
              handleSelectionChange(keys as Set<React.Key> | 'all')
            }
            variant='bordered'
            classNames={{...commonSelectClassNames, label: 'mb-4'}}
            isDisabled={repOptions.length === 0}
            aria-label='Default Sales Rep'
            renderValue={(items) => {
              const selected = items[0]
              const opt = repOptions.find((o) => o.key === selected?.key)
              if (!opt) return null
              return (
                <div className='flex items-center gap-2'>
                  <Avatar
                    alt={opt.label}
                    className='size-6 shrink-0'
                    name={opt.label}
                    size='sm'
                    src={opt.avatarUrl ?? undefined}
                  />
                  <span>{opt.label}</span>
                </div>
              )
            }}>
            {(opt) => (
              <SelectItem key={opt.key} textValue={opt.label}>
                <div className='flex items-center gap-2'>
                  <Avatar
                    alt={opt.label}
                    className='size-6 shrink-0'
                    name={opt.label}
                    size='sm'
                    src={opt.avatarUrl ?? undefined}
                  />
                  <span>{opt.label}</span>
                </div>
              </SelectItem>
            )}
          </Select>

          <Textarea
            label='Initial message seed for Cash App payments'
            placeholder='e.g. Cash App checkout request for order {orderNumber}. I selected Cash App and need a representative to continue payment in this chat.'
            value={displayInitialMessage}
            onValueChange={setPendingInitialMessageSeed}
            className='w-[94lvw] md:w-fit '
            classNames={commonInputClassNames}
            minRows={3}
          />

          <div className='w-fit flex flex-wrap'>
            Template for the first customer message when starting Cash App
            checkout chat.
          </div>

          <ViewTransition>
            <div className='flex items-center gap-3'>
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
        <aside className='flex flex-col gap-3'>
          <h3 className='text-sm font-medium uppercase tracking-wider text-foreground/70'>
            All Reps
          </h3>
          {repOptions.length === 0 ? (
            <p className='text-sm text-foreground/60'>
              No active staff with Rep position. Add staff in the personnel
              section.
            </p>
          ) : (
            <ul className='flex flex-col gap-2' role='list'>
              {(reps ?? [])
                .filter((r) => r.active)
                .map((member) => (
                  <RepUserItem key={member._id} member={member} />
                ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}

function RepUserItem({member}: {member: Doc<'staff'>}) {
  const name = member.name || member.email || 'Unnamed Rep'
  const description = member.email ?? member.position ?? ''
  return (
    <li className='rounded-lg border border-default-200/50 bg-default-50/30 p-3 dark:bg-default-100/10'>
      <User
        avatarProps={{src: member.avatarUrl}}
        classNames={{
          name: 'mb-0.5',
          description: 'text-xs text-foreground/70',
        }}
        name={name}
        description={description}
      />
    </li>
  )
}
