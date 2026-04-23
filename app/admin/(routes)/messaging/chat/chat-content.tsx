'use client'

import {ASSISTANT_PRO_ID} from '@/app/account/chat/_components/assistant'
import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {User} from '@/components/hero-v3/user'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {getInitials} from '@/utils/initials'
import {Tabs} from '@base-ui/react'
import {useQuery} from 'convex/react'
import dynamic from 'next/dynamic'
import {parseAsString, useQueryState} from 'nuqs'
import {startTransition, useState} from 'react'

const ChatWindow = dynamic(
  () =>
    import('@/components/main/chat-window').then((module) => module.ChatWindow),
  {
    ssr: false,
    loading: () => (
      <div className='fixed right-4 top-14 bottom-[calc(env(safe-area-inset-bottom)+2rem)] z-9100 w-[min(calc(100vw-2rem),34rem)] rounded-3xl border border-sidebar/50 bg-background/95 shadow-2xl backdrop-blur-xl md:right-8 lg:top-16 xl:top-20'>
        <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
          Loading chat...
        </div>
      </div>
    ),
  },
)

const CHAT_TABS = [
  {id: 'authed', label: 'Users'},
  {id: 'staff', label: 'Staff'},
  {id: 'guests', label: 'Guests'},
] as const

const DEFAULT_TAB = CHAT_TABS[0].id

const GUEST_VIEW_MODES = [
  {id: 'table', label: 'Table', icon: 'view-list'},
  {id: 'grid', label: 'Grid', icon: 'grid-nine'},
] as const

const DEFAULT_GUEST_VIEW = GUEST_VIEW_MODES[0].id

type ChatTabId = (typeof CHAT_TABS)[number]['id']
type GuestViewMode = (typeof GUEST_VIEW_MODES)[number]['id']
type UserDoc = Doc<'users'>
type StaffDoc = Doc<'staff'>
type GuestDoc = Doc<'guests'>

const getUserConversationFid = (participant: UserDoc) =>
  participant.fid ?? participant.firebaseId ?? null

const getNormalizedEmail = (email?: string | null) => {
  const normalizedEmail = email?.trim().toLowerCase()
  return normalizedEmail ? normalizedEmail : null
}

const getStaffLabel = ({
  position,
  division,
}: Pick<StaffDoc, 'position' | 'division'>) => {
  const trimmedPosition = position.trim()
  const trimmedDivision = division?.trim()

  if (trimmedPosition && trimmedDivision) {
    return `${trimmedPosition} • ${trimmedDivision}`
  }

  return trimmedPosition || trimmedDivision || 'Staff'
}

const getLocationLabel = ({
  city,
  countryCode,
  country,
}: {
  city?: string
  countryCode?: string
  country?: string
}) => {
  const trimmedCity = city?.trim()
  const trimmedCountryCode = countryCode?.trim().toUpperCase()
  const trimmedCountry = country?.trim()

  if (trimmedCity && trimmedCountryCode) {
    return `${trimmedCity}, ${trimmedCountryCode}`
  }

  if (trimmedCity && trimmedCountry) {
    return `${trimmedCity}, ${trimmedCountry}`
  }

  return (
    trimmedCity ??
    trimmedCountry ??
    trimmedCountryCode ??
    'Location unavailable'
  )
}

const getGuestDisplayName = (guest: GuestDoc) => guest.name?.trim() || 'Guest'

const getStatusLabel = (isActive?: boolean) => {
  if (isActive) {
    return 'Active'
  }

  if (isActive === false) {
    return 'Inactive'
  }

  return 'Unknown'
}

const getGuestLastSeenAt = (guest: GuestDoc) =>
  guest.updatedAt ?? guest.locationUpdatedAt ?? guest.createdAt ?? null

const formatGuestTimestamp = (timestamp?: number | null) => {
  if (!timestamp) {
    return 'Unavailable'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

interface ParticipantCardProps {
  avatarUrl?: string | null
  email?: string
  disabled?: boolean
  isActive?: boolean
  isSelected: boolean
  label: string
  locationLabel: string
  name: string
  subtitle: string
  onClick: VoidFunction
}

const ParticipantCard = ({
  avatarUrl,
  disabled = false,
  isActive,
  isSelected,
  label,
  locationLabel,
  name,
  onClick,
}: ParticipantCardProps) => {
  const statusLabel = getStatusLabel(isActive)

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex min-h-20 flex-col rounded-none border p-2 text-left transition-all duration-200',
        'border-light-gray dark:border-dark-gray bg-background/70 hover:-translate-y-px hover:border-brand',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-gray/60',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-sidebar/70 disabled:hover:shadow-none',
        isSelected && 'border-dark-gray bg-alum/30 shadow-lg',
      )}>
      <div className='flex items-center justify-between gap-2'>
        <User
          avatar={avatarUrl ?? undefined}
          name={getInitials(name)}
          className='size-6 shrink-0 bg-dark-table/10 dark:bg-alum text-dark-table'
        />
        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          <span
            aria-label={statusLabel}
            className={cn(
              'size-2 rounded-full',
              isActive
                ? 'bg-emerald-500'
                : 'bg-muted-foreground/30 dark:bg-muted-foreground/40',
            )}
          />
          <Icon
            name={label.toLowerCase() === 'authed' ? 'round-shield' : 'user'}
            className='size-5 text-emerald-500'
          />
        </div>
      </div>

      <div className='mt-1 space-y-1'>
        <p className='line-clamp-1 font-clash text-base font-normal'>{name}</p>
        <span className='font-okxs text-xs opacity-70 line-clamp-1'>
          {locationLabel}
        </span>
      </div>
    </button>
  )
}

interface GuestViewSwitcherProps {
  activeView: GuestViewMode
  onViewChange: (view: GuestViewMode) => void
}

const GuestViewSwitcher = ({
  activeView,
  onViewChange,
}: GuestViewSwitcherProps) => (
  <div
    role='group'
    aria-label='Guest list view'
    className='inline-flex w-fit items-center gap-1 rounded-sm border border-sidebar bg-background/70 p-0.5'>
    {GUEST_VIEW_MODES.map((mode) => (
      <button
        key={mode.id}
        type='button'
        aria-pressed={activeView === mode.id}
        onClick={() => {
          onViewChange(mode.id)
        }}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-xs px-2 text-xs font-medium transition-colors',
          'text-muted-foreground hover:bg-sidebar/50 hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-gray/60',
          activeView === mode.id &&
            'bg-dark-table text-white shadow-sm hover:bg-dark-table hover:text-white dark:bg-white dark:text-dark-table dark:hover:bg-white dark:hover:text-dark-table',
        )}>
        <Icon name={mode.icon} className='size-3.5' />
        <span>{mode.label}</span>
      </button>
    ))}
  </div>
)

interface GuestListViewProps {
  guestUsers: GuestDoc[]
  isChatWindowOpen: boolean
  selectedConversationFid: string | null
  onOpenConversation: (conversationFid: string) => void
}

const GuestGridView = ({
  guestUsers,
  isChatWindowOpen,
  onOpenConversation,
  selectedConversationFid,
}: GuestListViewProps) => (
  <div className='grid grid-cols-1 gap-3 [content-visibility:auto] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8 p-1'>
    {guestUsers.map((participant) => (
      <ParticipantCard
        key={participant._id}
        avatarUrl={participant.photoUrl}
        email={participant.email}
        isActive={participant.isActive}
        isSelected={
          selectedConversationFid === participant.fid && isChatWindowOpen
        }
        label='Guest'
        locationLabel={getLocationLabel(participant)}
        name={getGuestDisplayName(participant)}
        subtitle={participant.guestId}
        onClick={() => {
          onOpenConversation(participant.fid)
        }}
      />
    ))}
  </div>
)

const GuestTableView = ({
  guestUsers,
  isChatWindowOpen,
  onOpenConversation,
  selectedConversationFid,
}: GuestListViewProps) => (
  <div className='overflow-hidden rounded-sm border border-sidebar/80 bg-background/70'>
    <Table className='min-w-[48rem]'>
      <TableHeader>
        <TableRow className='bg-sidebar/40 hover:bg-sidebar/40'>
          <TableHead className='pl-3'>Guest</TableHead>
          <TableHead>Guest ID</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead className='pr-3 text-right'>Chat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {guestUsers.map((participant) => {
          const name = getGuestDisplayName(participant)
          const isSelected =
            selectedConversationFid === participant.fid && isChatWindowOpen
          const statusLabel = getStatusLabel(participant.isActive)

          return (
            <TableRow
              key={participant._id}
              data-state={isSelected ? 'selected' : undefined}
              className='hover:bg-sidebar/30'>
              <TableCell className='min-w-52 pl-3'>
                <div className='flex items-center gap-2'>
                  <User
                    avatar={participant.photoUrl ?? undefined}
                    name={getInitials(name)}
                    className='size-7 shrink-0 bg-dark-table/10 dark:bg-alum text-dark-table'
                  />
                  <div className='min-w-0'>
                    <p className='truncate font-clash text-sm'>{name}</p>
                    <p className='truncate font-mono text-[11px] text-muted-foreground'>
                      {participant.fid}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code className='rounded-xs bg-sidebar/50 px-1.5 py-0.5 text-[11px] uppercase'>
                  {participant.guestId}
                </code>
              </TableCell>
              <TableCell className='max-w-48 truncate'>
                {getLocationLabel(participant)}
              </TableCell>
              <TableCell>
                <span className='inline-flex items-center gap-1.5 rounded-full border border-sidebar px-2 py-0.5 text-xs'>
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      participant.isActive
                        ? 'bg-emerald-500'
                        : 'bg-muted-foreground/40',
                    )}
                  />
                  {statusLabel}
                </span>
              </TableCell>
              <TableCell className='text-xs text-muted-foreground'>
                {formatGuestTimestamp(getGuestLastSeenAt(participant))}
              </TableCell>
              <TableCell className='pr-3 text-right'>
                <button
                  type='button'
                  onClick={() => {
                    onOpenConversation(participant.fid)
                  }}
                  className='inline-flex h-8 items-center gap-1.5 rounded-xs border border-sidebar px-2 text-xs font-medium transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-gray/60'>
                  <Icon name='chat-rounded' className='size-4' />
                  <span>Open</span>
                </button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </div>
)

export const Content = () => {
  const {user} = useAuthCtx()
  const users = useQuery(api.users.q.getAllUsers, {limit: 5000})
  const staff = useQuery(api.staff.q.getStaff)
  const guests = useQuery(api.guests.q.getAllGuests, {limit: 5000})
  const [selectedTab, setSelectedTab] = useQueryState(
    'chatTab',
    parseAsString.withDefault(DEFAULT_TAB),
  )
  const [selectedGuestView, setSelectedGuestView] = useQueryState(
    'guestView',
    parseAsString.withDefault(DEFAULT_GUEST_VIEW),
  )
  const [selectedConversationFid, setSelectedConversationFid] = useState<
    string | null
  >(null)
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false)

  const activeTab = CHAT_TABS.some((tab) => tab.id === selectedTab)
    ? (selectedTab as ChatTabId)
    : DEFAULT_TAB
  const activeGuestView = GUEST_VIEW_MODES.some(
    (mode) => mode.id === selectedGuestView,
  )
    ? (selectedGuestView as GuestViewMode)
    : DEFAULT_GUEST_VIEW

  const usersById = new Map(
    (users ?? []).map((participant) => [String(participant._id), participant]),
  )
  const usersByEmail = new Map(
    (users ?? []).flatMap((participant) => {
      const email = getNormalizedEmail(participant.email)
      return email ? [[email, participant] as const] : []
    }),
  )

  const staffParticipants = (staff ?? [])
    .map((member) => {
      const normalizedEmail = getNormalizedEmail(member.email)
      let linkedUser = member.userId
        ? usersById.get(String(member.userId))
        : undefined
      if (!linkedUser && normalizedEmail) {
        linkedUser = usersByEmail.get(normalizedEmail)
      }
      const conversationFid = linkedUser
        ? getUserConversationFid(linkedUser)
        : null

      return {
        staff: member,
        linkedUser: linkedUser ?? null,
        conversationFid,
        normalizedEmail,
      }
    })
    .sort((a, b) => {
      if (a.staff.active !== b.staff.active) {
        return a.staff.active ? -1 : 1
      }

      return (a.staff.name ?? a.staff.email ?? a.staff.position).localeCompare(
        b.staff.name ?? b.staff.email ?? b.staff.position,
      )
    })

  const staffLinkedUserIds = new Set(
    staffParticipants.flatMap((participant) =>
      participant.linkedUser ? [String(participant.linkedUser._id)] : [],
    ),
  )
  const staffEmails = new Set(
    staffParticipants.flatMap((participant) =>
      participant.normalizedEmail ? [participant.normalizedEmail] : [],
    ),
  )
  const staffConversationFids = new Set(
    staffParticipants.flatMap((participant) =>
      participant.conversationFid ? [participant.conversationFid] : [],
    ),
  )

  const authenticatedUsers = (users ?? []).filter((participant) => {
    const fid = getUserConversationFid(participant)
    const normalizedEmail = getNormalizedEmail(participant.email)

    return (
      Boolean(fid) &&
      fid !== ASSISTANT_PRO_ID &&
      fid !== user?.uid &&
      !staffLinkedUserIds.has(String(participant._id)) &&
      !staffConversationFids.has(String(fid)) &&
      (!normalizedEmail || !staffEmails.has(normalizedEmail))
    )
  })

  const guestUsers = guests ?? []

  const openConversation = (conversationFid: string) => {
    startTransition(() => {
      setSelectedConversationFid(conversationFid)
      setIsChatWindowOpen(true)
    })
  }

  return (
    <MainWrapper className='h-[92lvh] overflow-y-scroll md:py-4'>
      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => {
          void setSelectedTab(value)
        }}>
        <div className='space-y-4'>
          <header className='flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'>
              Chat Console
            </p>
            <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
              <div className='flex flex-wrap items-center gap-1 text-xs text-muted-foreground md:gap-2'>
                <span className='rounded-full border border-sidebar px-1.5 md:px-3 py-0.5 md:py-1.5 capitalize font-ios'>
                  {authenticatedUsers.length} Users
                </span>
                <span className='rounded-full border border-sidebar px-1.5 md:px-3 py-0.5 md:py-1.5 capitalize font-ios'>
                  {staffParticipants.length} Staff
                </span>
                <span className='rounded-full border border-sidebar px-1.5 md:px-3 py-0.5 md:py-1.5 capitalize font-ios'>
                  {guestUsers.length} guests
                </span>
              </div>
            </div>
          </header>

          <Tabs.List className='relative z-0 flex gap-2 overflow-x-auto px-0'>
            {CHAT_TABS.map((tab) => (
              <Tabs.Tab
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex h-8 items-center justify-center border-0 px-2 break-keep whitespace-nowrap',
                  'font-okxs text-sm font-medium data-active:text-white',
                  'outline-none select-none before:inset-x-0 before:inset-y-1 before:rounded-sm',
                  'transition-colors duration-100 delay-100',
                )}>
                {tab.label}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className='absolute top-1/2 left-0 z-[-1] h-6 w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-1/2 rounded-sm bg-linear-to-r from-slate-600/90 via-slate-900/90 to-origin transition-all duration-300 ease-in-out dark:via-dark-table dark:to-dark-table' />
          </Tabs.List>
        </div>

        <Tabs.Panel
          value='authed'
          className='relative flex min-h-32 flex-1 flex-col py-4'>
          <section className='space-y-4'>
            {authenticatedUsers.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-sidebar p-8 text-center text-sm text-muted-foreground'>
                No authenticated users are available for chat.
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-2 [content-visibility:auto] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8 p-1'>
                {authenticatedUsers.map((participant) => {
                  const conversationFid = getUserConversationFid(participant)

                  if (!conversationFid) {
                    return null
                  }

                  return (
                    <ParticipantCard
                      key={participant._id}
                      avatarUrl={participant.photoUrl}
                      email={participant.email}
                      isActive={participant.isActive}
                      isSelected={
                        selectedConversationFid === conversationFid &&
                        isChatWindowOpen
                      }
                      label='Authed'
                      locationLabel={getLocationLabel(participant)}
                      name={
                        participant.name ||
                        participant.email?.split('@')[0] ||
                        'User'
                      }
                      subtitle={conversationFid}
                      onClick={() => {
                        openConversation(conversationFid)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </section>
        </Tabs.Panel>

        <Tabs.Panel
          value='staff'
          className='relative flex min-h-32 flex-1 flex-col py-4'>
          <section className='space-y-4'>
            {staffParticipants.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-sidebar p-8 text-center text-sm text-muted-foreground'>
                No staff members are available for chat.
              </div>
            ) : (
              <div className='grid grid-cols-1 gap-2 [content-visibility:auto] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8'>
                {staffParticipants.map((participant) => {
                  const conversationFid = participant.conversationFid
                  const displayName =
                    participant.staff.name?.trim() ||
                    participant.linkedUser?.name?.trim() ||
                    participant.normalizedEmail?.split('@')[0] ||
                    'Staff'

                  return (
                    <ParticipantCard
                      key={participant.staff._id}
                      avatarUrl={
                        participant.linkedUser?.photoUrl ??
                        participant.staff.avatarUrl
                      }
                      email={
                        participant.linkedUser?.email ?? participant.staff.email
                      }
                      disabled={!conversationFid}
                      isActive={participant.staff.active}
                      isSelected={
                        Boolean(conversationFid) &&
                        selectedConversationFid === conversationFid &&
                        isChatWindowOpen
                      }
                      label='Staff'
                      locationLabel={getStaffLabel(participant.staff)}
                      name={displayName}
                      subtitle={participant.staff.position}
                      onClick={() => {
                        if (!conversationFid) {
                          return
                        }

                        openConversation(conversationFid)
                      }}
                    />
                  )
                })}
              </div>
            )}
          </section>
        </Tabs.Panel>

        <Tabs.Panel
          value='guests'
          className='relative flex min-h-32 flex-1 flex-col py-4'>
          <section className='space-y-4'>
            {guestUsers.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-sidebar p-8 text-center text-sm text-muted-foreground'>
                No guest conversations have been created yet.
              </div>
            ) : (
              <>
                <div className='flex justify-end'>
                  <GuestViewSwitcher
                    activeView={activeGuestView}
                    onViewChange={(view) => {
                      void setSelectedGuestView(view)
                    }}
                  />
                </div>
                {activeGuestView === 'table' ? (
                  <GuestTableView
                    guestUsers={guestUsers}
                    isChatWindowOpen={isChatWindowOpen}
                    selectedConversationFid={selectedConversationFid}
                    onOpenConversation={openConversation}
                  />
                ) : (
                  <GuestGridView
                    guestUsers={guestUsers}
                    isChatWindowOpen={isChatWindowOpen}
                    selectedConversationFid={selectedConversationFid}
                    onOpenConversation={openConversation}
                  />
                )}
              </>
            )}
          </section>
        </Tabs.Panel>
      </Tabs.Root>

      <ChatWindow
        open={isChatWindowOpen}
        onOpenChange={setIsChatWindowOpen}
        conversationFid={selectedConversationFid}
      />
    </MainWrapper>
  )
}
