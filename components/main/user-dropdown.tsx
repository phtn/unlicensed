'use client'

import {api} from '@/convex/_generated/api'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {getInitials} from '@/utils/initials'
import {
  Avatar,
  Badge,
  Dropdown,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import {User} from 'firebase/auth'
import {useTheme} from 'next-themes'
import {useRouter} from 'next/navigation'
import {useMemo, type Key, type ReactNode} from 'react'

interface UserDropdownProps {
  user: User
  loading: boolean
  isStaff: boolean
  onLogout: VoidFunction
  onThemeToggle: VoidFunction
}

const getDisplayName = (user: User) => {
  const displayName = user.displayName?.trim()

  if (displayName) {
    return displayName
  }

  const localPart = user.email
    ?.split('@')[0]
    ?.replace(/[._-]+/g, ' ')
    .trim()

  if (!localPart) {
    return 'User'
  }

  return localPart
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const formatUnreadLabel = (count: number) => {
  return count > 99 ? '99+' : String(count)
}

export const UserDropdown = ({
  user,
  loading,
  isStaff,
  onLogout,
  onThemeToggle,
}: UserDropdownProps) => {
  const router = useRouter()
  const unreadCount = useQuery(
    api.messages.q.getUnreadCount,
    user ? {fid: user.uid} : 'skip',
  )

  const {theme} = useTheme()
  const isDarkMode = useMemo(() => theme === 'dark', [theme])

  const displayName = getDisplayName(user)
  const unreadTotal = unreadCount ?? 0
  const unreadLabel = formatUnreadLabel(unreadTotal)
  const profileDescription =
    user.email ?? (isStaff ? 'Staff account' : 'View your account')

  const handleAction = (key: Key) => {
    switch (String(key)) {
      case 'account':
        void router.push('/account')
        return
      case 'messages':
        void router.push('/account/chat')
        return
      case 'orders':
        void router.push('/account/orders')
        return
      case 'theme':
        onThemeToggle()
        return
      case 'admin':
        void router.push('/admin')
        return
      case 'logout':
        onLogout()
        return
      default:
        return
    }
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        isDisabled={loading}
        aria-label={
          unreadTotal > 0
            ? `Open account menu, ${unreadLabel} unread messages`
            : 'Open account menu'
        }
        className='group flex items-center justify-center relative rounded-full transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 disabled:cursor-wait disabled:opacity-70'>
        {loading ? (
          <span className='relative flex items-center justify-center rounded-full border border-white/50 bg-background/90 shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-dark-table'>
            <Icon name='spinners-ring' className='size-4 text-foreground/70' />
          </span>
        ) : (
          <Badge.Anchor>
            <Avatar className='relative size-9 border border-white/50 bg-background/90 text-foreground shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-dark-table'>
              <Avatar.Image
                alt={displayName}
                src={user.photoURL ?? undefined}
              />
              <Avatar.Fallback className='bg-background/90 text-[11px] font-medium tracking-tight text-foreground dark:bg-dark-table'>
                {getInitials(displayName)}
              </Avatar.Fallback>
            </Avatar>
            {unreadTotal > 0 ? (
              <Badge
                size='sm'
                className='font-clash text-[10px] font-medium leading-none text-white min-w-5 h-5 rounded-full border border-background bg-brand px-1.5 shadow-lg'>
                {unreadLabel}
              </Badge>
            ) : null}
          </Badge.Anchor>
        )}
      </Dropdown.Trigger>

      <Dropdown.Popover
        className='min-w-[18rem] rounded-xl p-2'
        placement='bottom end'>
        <Dropdown.Menu
          aria-label='User menu'
          onAction={handleAction}
          className='p-0'>
          <Dropdown.Section aria-label='Profile'>
            <Dropdown.Item id='account' textValue={displayName}>
              <MenuItemContent
                icon='user-setting-line'
                label={displayName}
                description={profileDescription}
                endContent={
                  isStaff ? <MenuPill tone='brand'>Staff</MenuPill> : null
                }
              />
            </Dropdown.Item>
          </Dropdown.Section>

          <Dropdown.Section aria-label='Quick actions'>
            <Dropdown.Item id='messages' textValue='Messages'>
              <MenuItemContent
                icon='message-filled'
                label='Messages'
                description='Open your inbox'
                endContent={
                  unreadTotal > 0 ? (
                    <MenuPill tone='brand'>{unreadLabel}</MenuPill>
                  ) : (
                    <MenuPill>Open</MenuPill>
                  )
                }
              />
            </Dropdown.Item>

            <Dropdown.Item id='orders' textValue='Orders'>
              <MenuItemContent
                icon='box'
                label='Orders'
                description='Track and review recent purchases'
              />
            </Dropdown.Item>

            <Dropdown.Item id='theme' textValue='Theme'>
              <MenuItemContent
                icon='toggle-theme'
                label={isDarkMode ? 'Light mode' : 'Dark mode'}
                description='Switch between light and dark modes'
              />
            </Dropdown.Item>

            {isStaff ? (
              <Dropdown.Item id='admin' textValue='Admin'>
                <MenuItemContent
                  icon='settings'
                  label='Admin'
                  description='Open the staff dashboard'
                  endContent={<MenuPill tone='brand'>Staff</MenuPill>}
                />
              </Dropdown.Item>
            ) : null}
          </Dropdown.Section>

          <Dropdown.Section aria-label='Session'>
            <Dropdown.Item id='logout' textValue='Sign out' variant='danger'>
              <MenuItemContent
                icon='signout'
                label='Sign out'
                description='End this session on this device'
                tone='danger'
              />
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

const MenuItemContent = ({
  icon,
  label,
  description,
  tone = 'default',
  endContent,
  iconClassName,
}: {
  icon: IconName
  label: string
  description?: string
  tone?: 'default' | 'brand' | 'danger'
  endContent?: ReactNode
  iconClassName?: string
}) => {
  return (
    <div className='flex min-w-0 items-center gap-3 py-0.5'>
      <MenuGlyph icon={icon} tone={tone} iconClassName={iconClassName} />
      <div className='min-w-0 flex-1'>
        <div className='truncate text-sm font-medium tracking-tight'>
          {label}
        </div>
        {description ? (
          <div className='truncate text-xs text-foreground/60'>
            {description}
          </div>
        ) : null}
      </div>
      {endContent ? <div className='shrink-0'>{endContent}</div> : null}
    </div>
  )
}

const MenuGlyph = ({
  icon,
  tone = 'default',
  iconClassName,
}: {
  icon: IconName
  tone?: 'default' | 'brand' | 'danger'
  iconClassName?: string
}) => {
  return (
    <span
      className={cn(
        'flex size-9 items-center justify-center text-foreground/75',
        tone === 'brand' && 'border-brand/15 bg-brand/10 text-brand',
        tone === 'danger' && 'border-danger/15 bg-danger/10 text-danger',
      )}>
      <Icon name={icon} className={cn('size-6', iconClassName)} />
    </span>
  )
}

const MenuPill = ({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'brand'
}) => {
  return (
    <span
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-clash font-medium leading-none uppercase tracking-[0.12em]',
        tone === 'brand'
          ? 'bg-brand text-white shadow-sm'
          : 'bg-foreground/10 text-foreground/70',
      )}>
      {children}
    </span>
  )
}
