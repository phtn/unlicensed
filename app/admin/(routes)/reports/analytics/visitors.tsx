'use client'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/animate-ui/components/radix/hover-card'
import {ChatWindow} from '@/components/main/chat-window'
import {DataTable} from '@/components/table-v2'
import {ColumnConfig} from '@/components/table-v2/create-column'
import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onError} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {formatDate, formatTimestamp} from '@/utils/date'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useMemo, useState} from 'react'

type GuestVisitorRow = Doc<'guestVisitors'> & {
  chatParticipantId: Id<'users'> | Id<'guests'> | null
  chatParticipantFid: string | null
  chatParticipantType: 'guest' | 'user' | null
  chatDisplayName: string | null
}
type GuestVisitorEventRow = Doc<'guestVisitorEvents'>

const EMPTY_VALUE = 'N/A'
const COMPACT_TEXT_CLASS = 'block truncate text-[11px] leading-4'
const COMPACT_MUTED_TEXT_CLASS =
  'block truncate text-[11px] leading-4 text-muted-foreground'
const COMPACT_MONO_CLASS =
  'block truncate font-mono text-[10px] leading-4 text-muted-foreground uppercase'
const ACTIVITY_PREVIEW_LIMIT = 6

const formatActivityType = (type: GuestVisitorEventRow['type']) =>
  type
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

const formatLocation = (visitor: GuestVisitorRow) => {
  const parts = [visitor.city, visitor.region, visitor.country].flatMap(
    (part) => {
      const normalized = part?.trim()
      return normalized ? [normalized] : []
    },
  )

  return parts.length > 0 ? parts.join(', ') : EMPTY_VALUE
}

const formatPath = (visitor: GuestVisitorRow) =>
  visitor.lastPath ?? visitor.firstPath ?? EMPTY_VALUE

const formatShortId = (value?: string | null, length = 10) =>
  value ? value.slice(0, length) : EMPTY_VALUE

const formatVisitorLabelPart = (value?: string | null) => {
  const normalized = value?.trim().replace(/[_\s-]+/g, ' ')
  if (!normalized) {
    return null
  }

  const compact = normalized
    .split(' ')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')

  return compact || null
}

const formatBrowsers = (visitor: GuestVisitorRow) => {
  const browsers = visitor.browsers?.length
    ? visitor.browsers
    : visitor.browser
      ? [visitor.browser]
      : []

  return browsers.length > 0 ? browsers.join(', ') : EMPTY_VALUE
}

const formatDevice = (visitor: GuestVisitorRow) => {
  const parts = [visitor.deviceType, visitor.os].flatMap((part) => {
    const normalized = part?.trim()
    return normalized ? [normalized] : []
  })

  return parts.length > 0 ? parts.join(' / ') : EMPTY_VALUE
}

const formatScreen = (visitor: GuestVisitorRow) =>
  visitor.screenWidth && visitor.screenHeight
    ? `${visitor.screenWidth}x${visitor.screenHeight}`
    : EMPTY_VALUE

const formatLocaleTimezone = (visitor: GuestVisitorRow) => {
  const timezone = visitor.timezone?.split('/').at(-1)?.replaceAll('_', ' ')
  const parts = [visitor.locale, timezone].flatMap((part) => {
    const normalized = part?.trim()
    return normalized ? [normalized] : []
  })

  return parts.length > 0 ? parts.join(' / ') : EMPTY_VALUE
}

const getLocaleLocation = (visitor: GuestVisitorRow) => {
  const localeValue = formatLocaleTimezone(visitor)
  if (!localeValue.includes('/')) {
    return null
  }

  return localeValue.split('/').at(-1)?.trim() ?? null
}

const formatGuestVisitorLabel = (visitor: GuestVisitorRow) => {
  const location =
    formatVisitorLabelPart(getLocaleLocation(visitor)) ??
    formatVisitorLabelPart(visitor.country) ??
    'Unknown'
  const os =
    formatVisitorLabelPart(visitor.os) ??
    formatVisitorLabelPart(visitor.deviceType) ??
    'Unknown'

  return `V-${location}-${os}`
}

const formatChatLabel = (visitor: GuestVisitorRow) => {
  if (visitor.chatParticipantType === 'user') {
    return (
      visitor.chatDisplayName?.trim() ||
      (visitor.linkedUserFid
        ? `User ${formatShortId(visitor.linkedUserFid, 8)}`
        : `User ${formatShortId(visitor.visitorId, 8)}`)
    )
  }

  return formatGuestVisitorLabel(visitor)
}

const formatUtm = (visitor: GuestVisitorRow) => {
  const parts = [
    visitor.utmSource,
    visitor.utmCampaign ?? visitor.utmMedium,
  ].flatMap((part) => {
    const normalized = part?.trim()
    return normalized ? [normalized] : []
  })

  return parts.length > 0 ? parts.join(' / ') : EMPTY_VALUE
}

const formatReferrer = (visitor: GuestVisitorRow) => {
  const referrer = visitor.lastReferrer ?? visitor.firstReferrer
  if (!referrer) {
    return EMPTY_VALUE
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return referrer
  }
}

const formatEventTitle = (event: GuestVisitorEventRow) =>
  event.title?.trim() ||
  event.path ||
  event.fullPath ||
  formatActivityType(event.type)

const formatEventPath = (event: GuestVisitorEventRow) =>
  event.fullPath?.trim() || event.path || EMPTY_VALUE

const formatEventMetadata = (event: GuestVisitorEventRow) => {
  if (!event.metadata) {
    return null
  }

  const entries = Object.entries(event.metadata).slice(0, 3)
  if (entries.length === 0) {
    return null
  }

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ')
}

function ActivityList({
  title,
  events,
  emptyLabel,
}: {
  title: string
  events: GuestVisitorEventRow[]
  emptyLabel: string
}) {
  return (
    <section className='min-w-0'>
      <div className='mb-1.5 flex items-center gap-3'>
        <p className='font-okxs text-[10px] uppercase tracking-wide text-muted-foreground'>
          {title}
        </p>
        <span className='font-mono text-[10px] text-muted-foreground'>
          {events.length}
        </span>
      </div>
      {events.length === 0 ? (
        <p className='text-[11px] text-muted-foreground'>{emptyLabel}</p>
      ) : (
        <div className='space-y-1.5'>
          {events.slice(0, ACTIVITY_PREVIEW_LIMIT).map((event) => {
            const metadata = formatEventMetadata(event)

            return (
              <div className='flex items-center '>
                <div
                  key={event._id}
                  className='flex flex-col rounded-sm border border-foreground/15 bg-background/70 px-2 py-2 w-full'>
                  <div className='flex min-w-0 items-start justify-between gap-1'>
                    <p
                      className='min-w-0 truncate text-[11px] font-medium leading-4 max-w-[30ch]'
                      title={formatEventTitle(event)}>
                      {formatEventTitle(event).replaceAll(' ', '')}
                    </p>
                  </div>
                  <p
                    className='truncate font-mono text-[10px] leading-4 text-muted-foreground text-balance'
                    title={formatEventPath(event)}>
                    {formatEventPath(event)
                      .replaceAll('/lobby', 'L')
                      .replaceAll('/category', '/C')
                      .replaceAll('/products', '/P')
                      .replaceAll('/account', 'A')
                      .replaceAll('/chat', '/C')}
                  </p>
                </div>

                <div className='flex-1 min-w-8 text-right'>
                  <p
                    className='shrink-0 whitespace-nowrap font-okxs font-medium text-[9px] text-foreground/70'
                    title={
                      event.createdAt
                        ? formatDate(event.createdAt)
                        : EMPTY_VALUE
                    }>
                    {formatTimestamp(event.createdAt)?.replaceAll(' ago', '') ??
                      EMPTY_VALUE}
                  </p>
                  {metadata ? (
                    <p
                      className='font-mono text-foreground/50 text-[8px] leading-4 whitespace-nowrap uppercase text-right'
                      title={metadata}>
                      {metadata
                        .replaceAll('browserFingerprintId:', '')
                        .replaceAll('returningVisitor: true', 'RV')
                        .replaceAll('returningVisitor: false', 'NV')
                        .slice(0, 5)}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function VisitorActivityHoverCard({visitor}: {visitor: GuestVisitorRow}) {
  const [open, setOpen] = useState(false)
  const events = useQuery(
    api.guestTracking.q.getRecentEvents,
    open ? {visitorId: visitor.visitorId, limit: 24} : 'skip',
  )
  const pageEvents = events?.filter((event) => event.type === 'page_view') ?? []
  const actionEvents =
    events?.filter((event) => event.type !== 'page_view') ?? []

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type='button'
          className='rounded px-1 py-0.5 text-center font-okxs text-xs leading-4 transition-colors hover:bg-sidebar hover:text-mac-blue focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-mac-blue dark:hover:text-mac-blue'
          aria-label={`Show stored pages and events for ${formatChatLabel(visitor)}`}>
          {visitor.pageViewCount.toLocaleString('en-US')}/
          {visitor.eventCount.toLocaleString('en-US')}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align='start'
        side='top'
        sideOffset={8}
        className='w-96 max-w-[calc(100vw-2rem)] space-y-3 p-3 bg-sidebar dark:bg-dark-table border-foreground/30'>
        <div className='min-w-0'>
          <p className='truncate text-xs font-semibold'>
            {formatChatLabel(visitor)}
          </p>
          <p className='text-[10px] text-muted-foreground'>
            {visitor.pageViewCount.toLocaleString('en-US')} Visits ·{' '}
            {visitor.eventCount.toLocaleString('en-US')} Events
          </p>
        </div>
        {events === undefined ? (
          <p className='py-4 text-center text-[11px] text-muted-foreground'>
            Loading stored activity...
          </p>
        ) : (
          <div className='grid gap-3'>
            <ActivityList
              title='Pages'
              events={pageEvents}
              emptyLabel='No page views stored yet.'
            />
            <ActivityList
              title='Events'
              events={actionEvents}
              emptyLabel='No non-page events stored yet.'
            />
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export const VisitorData = () => {
  const {user} = useAuthCtx()
  const connectCustomerForChat = useMutation(
    api.follows.m.connectCustomerForChat,
  )
  const visitorsQuery = useQuery(api.guestTracking.q.getRecentVisitors, {
    limit: 500,
  })
  const data = (visitorsQuery ?? []) as GuestVisitorRow[]
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false)
  const [chatConversationFid, setChatConversationFid] = useState<string | null>(
    null,
  )
  const [chatConversationSelectionKey, setChatConversationSelectionKey] =
    useState(0)
  const [isOpeningChat, setIsOpeningChat] = useState(false)

  const handleOpenVisitorChat = useCallback(
    async (visitor: GuestVisitorRow) => {
      if (isOpeningChat) return

      if (!user?.uid) {
        onError('You must be signed in to start a chat')
        return
      }

      if (!visitor.chatParticipantId) {
        onError('This visitor does not have a saved chat room yet')
        return
      }

      setIsOpeningChat(true)
      try {
        const result = await connectCustomerForChat({
          customerId: visitor.chatParticipantId,
          currentUserFid: user.uid,
        })

        if (result.customerFid === user.uid) {
          onError('Cannot open chat with your own account')
          return
        }

        setChatConversationFid(result.customerFid)
        setChatConversationSelectionKey((current) => current + 1)
        setIsChatWindowOpen(true)
      } catch (error) {
        onError(
          error instanceof Error
            ? error.message
            : 'Unable to open visitor chat',
        )
      } finally {
        setIsOpeningChat(false)
      }
    },
    [connectCustomerForChat, isOpeningChat, user?.uid],
  )

  const columns = useMemo(
    () =>
      [
        {
          id: 'chatParticipantId',
          header: 'Chat',
          accessorKey: 'chatParticipantId',
          size: 40,
          enableFiltering: false,
          enableHiding: false,
          enableSorting: false,
          cell: ({row}) => {
            const canChat = Boolean(row.original.chatParticipantId)

            return (
              <Button
                isIconOnly
                size='sm'
                variant='tertiary'
                aria-label={`Open chat with ${formatChatLabel(row.original)}`}
                isDisabled={!canChat || isOpeningChat}
                onPress={() => {
                  void handleOpenVisitorChat(row.original)
                }}
                className='h-7 w-7 min-w-7 rounded-md bg-sidebar/20 text-neutral-600 hover:bg-neutral-200 dark:text-white dark:hover:bg-neutral-800 disabled:opacity-30'>
                <Icon name='chat' className='size-4' />
              </Button>
            )
          },
        },
        {
          id: 'chatDisplayName',
          header: 'Name',
          accessorKey: 'chatDisplayName',
          size: 140,
          cell: ({row}) => {
            const isVisitor = row.original.chatParticipantType !== 'user'

            return (
              <span
                className={
                  isVisitor
                    ? `${COMPACT_TEXT_CLASS} font-medium text-orange-500 dark:text-orange-300`
                    : COMPACT_TEXT_CLASS
                }
                title={formatChatLabel(row.original)}>
                {formatChatLabel(row.original)}
              </span>
            )
          },
        },

        {
          id: 'pageViewCount',
          header: 'V/E',
          accessorKey: 'pageViewCount',
          size: 60,
          cell: ({row}) => <VisitorActivityHoverCard visitor={row.original} />,
        },
        {
          id: 'city',
          header: 'Loc',
          accessorKey: 'city',
          size: 40,
          cell: ({row}) => (
            <span
              className={`${COMPACT_MUTED_TEXT_CLASS} uppercase`}
              title={formatLocation(row.original)}>
              {formatLocation(row.original)}
            </span>
          ),
        },
        {
          id: 'timezone',
          header: 'Timezone',
          accessorKey: 'timezone',
          size: 100,
          cell: ({row}) => (
            <span
              className={COMPACT_MUTED_TEXT_CLASS}
              title={formatLocaleTimezone(row.original)}>
              {formatLocaleTimezone(row.original).replaceAll('en-US / ', '')}
            </span>
          ),
        },
        {
          id: 'lastSeenAt',
          header: 'Last Visit',
          accessorKey: 'lastSeenAt',
          size: 100,
          cell: ({row}) => (
            <span
              className={COMPACT_MUTED_TEXT_CLASS}
              title={
                row.original.lastSeenAt
                  ? formatDate(row.original.lastSeenAt)
                  : EMPTY_VALUE
              }>
              {formatTimestamp(row.original.lastSeenAt) ?? EMPTY_VALUE}
            </span>
          ),
        },
        {
          id: 'deviceType',
          header: 'Device',
          accessorKey: 'deviceType',
          size: 80,
          cell: ({row}) => (
            <span
              className={`${COMPACT_TEXT_CLASS} uppercase`}
              title={formatDevice(row.original)}>
              {formatDevice(row.original)?.split(' /').shift()}
            </span>
          ),
        },
        {
          id: 'deviceOS',
          header: 'OS',
          accessorKey: 'deviceType',
          size: 80,
          cell: ({row}) => (
            <span
              className={`${COMPACT_TEXT_CLASS} uppercase`}
              title={formatDevice(row.original)}>
              {formatDevice(row.original)?.split('/ ').pop()}
            </span>
          ),
        },
        {
          id: 'browser',
          header: 'Browser',
          accessorKey: 'browser',
          size: 80,
          cell: ({row}) => (
            <span
              className={`${COMPACT_TEXT_CLASS} uppercase`}
              title={formatBrowsers(row.original)}>
              {formatBrowsers(row.original)}
            </span>
          ),
        },
        {
          id: 'screenWidth',
          header: 'Screen',
          accessorKey: 'screenWidth',
          size: 82,
          cell: ({row}) => (
            <span className={COMPACT_MUTED_TEXT_CLASS}>
              {formatScreen(row.original)}
            </span>
          ),
        },

        {
          id: 'lastReferrer',
          header: 'Referrer',
          accessorKey: 'lastReferrer',
          size: 128,
          cell: ({row}) => (
            <span
              className={COMPACT_MUTED_TEXT_CLASS}
              title={formatReferrer(row.original)}>
              {formatReferrer(row.original)}
            </span>
          ),
        },
        {
          id: 'lastPath',
          header: 'Path',
          accessorKey: 'lastPath',
          size: 190,
          cell: ({row}) => (
            <span
              className={COMPACT_TEXT_CLASS}
              title={formatPath(row.original)}>
              {formatPath(row.original)}
            </span>
          ),
        },
        {
          id: 'utmSource',
          header: 'UTM',
          accessorKey: 'utmSource',
          size: 116,
          cell: ({row}) => (
            <span
              className={COMPACT_MUTED_TEXT_CLASS}
              title={formatUtm(row.original)}>
              {formatUtm(row.original)}
            </span>
          ),
        },

        {
          id: 'deviceFingerprintId',
          header: 'FP',
          accessorKey: 'deviceFingerprintId',
          size: 88,
          cell: ({row}) => (
            <code className={COMPACT_MONO_CLASS}>
              {formatShortId(row.original.deviceFingerprintId)}
            </code>
          ),
        },
        {
          id: 'linkedUserFid',
          header: 'User',
          accessorKey: 'linkedUserFid',
          size: 88,
          cell: ({row}) => (
            <code className={COMPACT_MONO_CLASS}>
              {formatShortId(row.original.linkedUserFid)}
            </code>
          ),
        },
        {
          id: 'chatParticipantType',
          header: 'Type',
          accessorKey: 'chatParticipantType',
          size: 70,
          cell: ({row}) => (
            <span className={`${COMPACT_MUTED_TEXT_CLASS} uppercase`}>
              {row.original.chatParticipantType ?? EMPTY_VALUE}
            </span>
          ),
        },
        {
          id: 'visitorId',
          header: 'VID',
          accessorKey: 'visitorId',
          size: 90,
          cell: ({row}) => (
            <code className={COMPACT_MONO_CLASS}>
              {formatShortId(row.original.visitorId)}
            </code>
          ),
        },
        {
          id: 'firstSeenAt',
          header: 'First Visit',
          accessorKey: 'firstSeenAt',
          size: 120,
          cell: ({row}) => (
            <span className={COMPACT_MUTED_TEXT_CLASS}>
              {row.original.firstSeenAt
                ? formatDate(row.original.firstSeenAt)
                : EMPTY_VALUE}
            </span>
          ),
        },
      ] as ColumnConfig<GuestVisitorRow>[],
    [handleOpenVisitorChat, isOpeningChat],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {chatConversationFid && (
        <ChatWindow
          open={isChatWindowOpen}
          onOpenChange={setIsChatWindowOpen}
          conversationFid={chatConversationFid}
          conversationSelectionKey={chatConversationSelectionKey}
        />
      )}
      <DataTable
        title='Visitors'
        data={data}
        loading={visitorsQuery === undefined}
        columnConfigs={columns}
        editingRowId={null}
        defaultPageSize={50}
        defaultLoadedCount={500}
        loadedCountParamKey='visitorsLoadedCount'
        enableRowPinning
        rowIdAccessor='visitorId'
        rowPinningParamKey='visitorsPinnedRows'
      />
    </div>
  )
}
