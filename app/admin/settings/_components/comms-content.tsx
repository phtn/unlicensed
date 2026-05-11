'use client'

import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {CommsChannel} from '@/convex/admin/d'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useState, ViewTransition} from 'react'
import {Toggle} from '../../_components/ui/toggle'
import {ContentHeader, LoadingHeader, PrimaryButton} from './components'

const COMMS_CHANNELS_IDENTIFIER = 'comms_channels'
const COMMS_CHANNELS_DEFAULT: CommsChannel[] = [
  {id: 'messenger', title: 'Messenger', link: '', isActive: true},
  {id: 'whatsapp', title: 'WhatsApp', link: '', isActive: true},
  {id: 'telegram', title: 'Telegram', link: '', isActive: true},
  {id: 'sms', title: 'SMS', link: '', isActive: true},
]

const CHANNEL_PRESETS: CommsChannel[] = [...COMMS_CHANNELS_DEFAULT]

type EditableCommsChannel = CommsChannel & {
  rowId: string
}

function allocateRowId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `comms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function toEditableChannel(channel: CommsChannel): EditableCommsChannel {
  return {
    ...channel,
    rowId: allocateRowId(),
  }
}

function serializeChannels(channels: EditableCommsChannel[]): CommsChannel[] {
  return channels.map(({rowId: _rowId, ...channel}) => channel)
}

function slugifyChannelId(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'channel'
  )
}

function ensureUniqueChannelId(
  baseId: string,
  rowId: string,
  channels: EditableCommsChannel[],
) {
  let nextId = baseId
  let suffix = 2

  while (
    channels.some((channel) => channel.rowId !== rowId && channel.id === nextId)
  ) {
    nextId = `${baseId}-${suffix}`
    suffix += 1
  }

  return nextId
}

export const CommsChannelContent = () => {
  const {user} = useAuthCtx()
  const [channels, setChannels] = useState<EditableCommsChannel[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const savedChannels = useQuery(api.admin.q.getCommsChannels, {
    identifier: COMMS_CHANNELS_IDENTIFIER,
  })
  const updateChannels = useMutation(api.admin.m.updateCommsChannels)

  const persistedChannels = useMemo(
    () => savedChannels ?? COMMS_CHANNELS_DEFAULT,
    [savedChannels],
  )
  const normalizedChannels = useMemo(
    () => serializeChannels(channels),
    [channels],
  )
  const isLoading = savedChannels === undefined
  const isDirty =
    JSON.stringify(normalizedChannels) !== JSON.stringify(persistedChannels)

  const handleChannelChange = useCallback((id: string, value: string) => {
    setSaveMessage(null)
    setChannels((prev) =>
      prev.map((channel) =>
        channel.rowId === id ? {...channel, link: value} : channel,
      ),
    )
  }, [])

  const handleChannelTitleChange = useCallback((id: string, value: string) => {
    setSaveMessage(null)
    setChannels((prev) => {
      const nextId = ensureUniqueChannelId(slugifyChannelId(value), id, prev)

      return prev.map((channel) =>
        channel.rowId === id
          ? {
              ...channel,
              id: nextId,
              title: value,
            }
          : channel,
      )
    })
  }, [])

  const handleChannelVisibilityChange = useCallback(
    (id: string, checked: boolean) => {
      setSaveMessage(null)
      setChannels((prev) =>
        prev.map((channel) =>
          channel.rowId === id ? {...channel, isActive: checked} : channel,
        ),
      )
    },
    [],
  )

  const handleAddChannel = useCallback(() => {
    setSaveMessage(null)
    setChannels((prev) => {
      const preset = CHANNEL_PRESETS.find(
        (channel) => !prev.some((existing) => existing.id === channel.id),
      )
      const rowId = allocateRowId()

      if (preset) {
        return [...prev, {...preset, rowId}]
      }

      const index = prev.length + 1
      const title = `Channel ${index}`
      const id = ensureUniqueChannelId(slugifyChannelId(title), rowId, prev)

      return [...prev, {rowId, id, title, link: '', isActive: true}]
    })
  }, [])

  const handleDeleteChannel = useCallback(
    (id: string) => () => {
      setSaveMessage(null)
      setChannels((prev) => prev.filter((channel) => id !== channel.rowId))
    },
    [],
  )

  useEffect(() => {
    if (savedChannels === undefined) return

    setChannels(persistedChannels.map((channel) => toEditableChannel(channel)))
  }, [persistedChannels, savedChannels])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      await updateChannels({
        channels: normalizedChannels,
        uid: user?.uid,
      })
      setSaveMessage('saved')
    } catch {
      setSaveMessage('error')
    } finally {
      setIsSaving(false)
    }
  }, [normalizedChannels, updateChannels, user?.uid])

  if (isLoading) {
    return <LoadingHeader title='Communication Channels' />
  }

  return (
    <div className='flex flex-col gap-4'>
      <ContentHeader
        title='Communication Channels'
        description='Manage communication channels link and visibility.'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            size='sm'
            isIconOnly
            variant='primary'
            onPress={handleAddChannel}
            className='bg-foreground size-5.5'>
            <Icon name='plus' className='size-4 m-auto dark:text-dark-table' />
          </Button>
          <PrimaryButton
            onPress={() => void handleSave()}
            icon={isSaving ? 'spinners-ring' : 'save'}
            label='Save Changes'
            disabled={isSaving || !isDirty}
          />
          {saveMessage === 'saved' && (
            <span className='text-sm text-emerald-600 dark:text-emerald-400'>
              Saved
            </span>
          )}
          {saveMessage === 'error' && (
            <span className='text-sm text-destructive'>Save failed</span>
          )}
        </div>
      </ContentHeader>

      <div className='grid gap-6 md:px-2'>
        <section className='flex flex-col gap-4'>
          <ul className='flex max-w-4xl flex-col gap-3' role='list'>
            {channels.map((channel) => (
              <ViewTransition key={channel.rowId}>
                <li
                  className={cn(
                    'flex min-w-0 flex-col gap-3 p-3 transition-colors dark:border-default-100/20 dark:bg-default-100/30',
                    'hover:border-border/80 dark:hover:border-border/60',
                  )}
                  role='listitem'>
                  <div className='grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto_auto] md:items-end'>
                    <Input
                      label='Channel'
                      value={channel.title}
                      onChange={(e) =>
                        handleChannelTitleChange(channel.rowId, e.target.value)
                      }
                      placeholder='Messenger'
                      autoComplete='off'
                      spellCheck={false}
                      aria-label={`Channel name ${channel.title}`}
                    />
                    <Input
                      label='Value'
                      value={channel.link}
                      onChange={(e) =>
                        handleChannelChange(channel.rowId, e.target.value)
                      }
                      placeholder='https://m.me/your-page'
                      autoComplete='off'
                      spellCheck={false}
                      aria-label={`Channel link ${channel.title}`}
                    />
                    <div className='flex min-h-18 min-w-28 flex-col justify-center gap-2 rounded-md border border-light-gray/80 bg-background px-3 py-2 dark:border-dark-table/80 dark:bg-background/60'>
                      <span className='text-xs font-medium uppercase tracking-[0.2em] text-foreground/60'>
                        Visible
                      </span>
                      <Toggle
                        title={`Toggle ${channel.title}`}
                        checked={channel.isActive}
                        onChange={(checked) =>
                          handleChannelVisibilityChange(channel.rowId, checked)
                        }
                      />
                    </div>
                    <Button
                      size='sm'
                      isIconOnly
                      variant='ghost'
                      onPress={handleDeleteChannel(channel.rowId)}
                      className='mt-auto size-10 rounded-md'
                      aria-label={`Delete ${channel.title}`}>
                      <Icon name='trash' className='size-4' />
                    </Button>
                  </div>
                </li>
              </ViewTransition>
            ))}
          </ul>

          {channels.length === 0 && (
            <div className='px-2 text-sm text-foreground/60'>
              No communication channels configured.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
