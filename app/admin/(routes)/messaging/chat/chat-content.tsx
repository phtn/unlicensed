'use client'

import {ASSISTANT_PRO_ID} from '@/app/account/chat/_components/assistant'
import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Tabs} from '@base-ui/react'
import {Avatar, Badge} from '@heroui/react'
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

type ChatTabId = (typeof CHAT_TABS)[number]['id']
type UserDoc = Doc<'users'>
type StaffDoc = Doc<'staff'>

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

interface ParticipantCardProps {
  avatarUrl?: string | null
  email?: string
  disabled?: boolean
  isActive?: boolean
  isSelected: boolean
  label: string
  locationLabel: string
  name: string
  statusText?: string
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
  statusText,
  subtitle,
  onClick,
}: ParticipantCardProps) => {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex min-h-44 flex-col rounded-2xl border p-3 text-left transition-all duration-200',
        'border-sidebar/70 bg-background/70 hover:-translate-y-0.5 hover:border-dark-gray/60 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-gray/60',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:border-sidebar/70 disabled:hover:shadow-none',
        isSelected && 'border-dark-gray bg-alum/30 shadow-lg',
      )}>
      <div className='flex items-start justify-between gap-2'>
        <Badge
          isOneChar
          variant='solid'
          placement='bottom-right'
          color={isActive ? 'success' : 'warning'}>
          <Avatar
            src={avatarUrl ?? undefined}
            name={name}
            className='size-10 shrink-0 bg-dark-table/10 dark:bg-alum text-dark-table'
          />
        </Badge>
        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          <span className='rounded-full border border-sidebar'>
            <Icon
              name={label.toLowerCase() === 'authed' ? 'safe-shield' : 'user'}
              className='size-4 text-emerald-400/80'
            />
          </span>
        </div>
      </div>

      <div className='mt-4 space-y-1'>
        <p className='line-clamp-1 font-clash text-base font-medium'>{name}</p>
        <span className='font-okxs text-xs opacity-70 line-clamp-1'>
          {locationLabel}
        </span>
        {/*<p className='line-clamp-1 text-sm opacity-70'>{email}</p>*/}
      </div>

      <div className='hidden mt-5 space-y-2 text-xs text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <Icon name='pin' className='size-4' />
        </div>
        <div className='hidden _flex items-center gap-2'>
          <span className='font-medium uppercase tracking-[0.16em] text-[10px] text-foreground/70'>
            Ref
          </span>
          <span className='line-clamp-1'>{subtitle}</span>
        </div>
      </div>

      <div className='mt-auto flex items-center justify-between pt-5'>
        <span className='text-xs text-muted-foreground'>{statusText}</span>
        <span className='inline-flex size-9 items-center justify-center rounded-full bg-dark-table text-white transition-transform duration-200 group-hover:scale-105'>
          <Icon name='chat' className='size-4' />
        </span>
      </div>
    </button>
  )
}

export const Content = () => {
  const {user} = useAuthCtx()
  const users = useQuery(api.users.q.getAllUsers, {limit: 5000})
  const staff = useQuery(api.staff.q.getStaff)
  const guests = useQuery(api.guests.q.getAllGuests, {limit: 5000})
  const [selectedTab, setSelectedTab] = useQueryState(
    'chatTab',
    parseAsString.withDefault(DEFAULT_TAB),
  )
  const [selectedConversationFid, setSelectedConversationFid] = useState<
    string | null
  >(null)
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false)

  const activeTab = CHAT_TABS.some((tab) => tab.id === selectedTab)
    ? (selectedTab as ChatTabId)
    : DEFAULT_TAB

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
      const linkedUser =
        (member.userId
          ? (usersById.get(String(member.userId)) ?? null)
          : null) ??
        (normalizedEmail ? (usersByEmail.get(normalizedEmail) ?? null) : null)
      const conversationFid = linkedUser
        ? getUserConversationFid(linkedUser)
        : null

      return {
        staff: member,
        linkedUser,
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
          <header className='flex items-center justify-between pt-1'>
            <p className='text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'>
              Chat Console - Direct routing
            </p>
            <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span className='rounded-full border border-sidebar px-3 py-1.5 capitalize font-ios'>
                  {authenticatedUsers.length} Users
                </span>
                <span className='rounded-full border border-sidebar px-3 py-1.5 capitalize font-ios'>
                  {staffParticipants.length} Staff
                </span>
                <span className='rounded-full border border-sidebar px-3 py-1.5 capitalize font-ios'>
                  {guestUsers.length} guests
                </span>
              </div>
            </div>
          </header>

          <Tabs.List className='relative z-0 flex gap-2 overflow-x-auto px-0 pb-1'>
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
              <div className='grid grid-cols-1 gap-2 [content-visibility:auto] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8'>
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
                      statusText={
                        conversationFid ? undefined : 'No chat profile'
                      }
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
              <div className='grid grid-cols-1 gap-3 [content-visibility:auto] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8'>
                {guestUsers.map((participant) => (
                  <ParticipantCard
                    key={participant._id}
                    avatarUrl={participant.photoUrl}
                    email={participant.email}
                    isActive={participant.isActive}
                    isSelected={
                      selectedConversationFid === participant.fid &&
                      isChatWindowOpen
                    }
                    label='Guest'
                    locationLabel={getLocationLabel(participant)}
                    name={participant.name || 'Guest'}
                    subtitle={participant.guestId}
                    onClick={() => {
                      openConversation(participant.fid)
                    }}
                  />
                ))}
              </div>
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
