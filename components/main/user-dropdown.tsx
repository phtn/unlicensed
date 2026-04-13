'use client'

import {api} from '@/convex/_generated/api'
import {openAdminMasterMonitor} from '@/lib/admin-master-monitor'
import {Icon, IconName} from '@/lib/icons'
import {
  canAccessMasterMonitor,
  getMasterMonitorEmails,
  MASTER_MONITOR_IDENTIFIER,
} from '@/lib/master-monitor-access'
import {cn} from '@/lib/utils'
import {getInitials} from '@/utils/initials'
import {Avatar, Badge, Dropdown} from '@heroui/react'
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
  const staff = useQuery(
    api.staff.q.getStaffByEmail,
    user.email ? {email: user.email} : 'skip',
  )
  const masterMonitorSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: MASTER_MONITOR_IDENTIFIER,
  })

  const {theme} = useTheme()
  const isDarkMode = useMemo(() => theme === 'dark', [theme])
  const masterEmails = useMemo(
    () => getMasterMonitorEmails(masterMonitorSetting),
    [masterMonitorSetting],
  )
  const canOpenMasterMonitor = useMemo(
    () =>
      canAccessMasterMonitor({
        staff,
        email: user.email,
        masterEmails,
      }),
    [masterEmails, staff, user.email],
  )

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
      case 'master-monitor':
        openAdminMasterMonitor()
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
          <span className='relative flex items-center justify-center rounded-full border border-white/50 bg-background/90 dark:border-white/10 dark:bg-dark-table'>
            <Icon name='spinners-ring' className='size-4 text-foreground/70' />
          </span>
        ) : (
          <Badge.Anchor>
            <Avatar className='relative size-9 border border-white/50 bg-background/90 text-foreground dark:border-white/10 dark:bg-dark-table'>
              <Avatar.Image
                alt={displayName}
                src={user.photoURL ?? undefined}
              />
              <Avatar.Fallback className='bg-background/90 text-sm font-clash font-medium md:font-bold text-foreground dark:bg-dark-table/50'>
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
        className='min-w-[18rem] rounded-sm p-2'
        placement='bottom end'>
        <Dropdown.Menu
          aria-label='User menu'
          onAction={handleAction}
          className='p-0'>
          <Dropdown.Section aria-label='Profile'>
            <Dropdown.Item
              id='account'
              textValue={displayName}
              className='rounded-xs'>
              <MenuItemContent
                icon='user-setting-line'
                label={'Account'}
                description={profileDescription}
              />
            </Dropdown.Item>
          </Dropdown.Section>

          <Dropdown.Section aria-label='Quick actions'>
            <Dropdown.Item
              id='messages'
              textValue='Messages'
              className='rounded-xs'>
              <MenuItemContent
                icon='message-filled'
                label='Messages'
                description='Open your inbox'
                endContent={
                  unreadTotal > 0 && (
                    <MenuPill tone='brand'>{unreadLabel}</MenuPill>
                  )
                }
              />
            </Dropdown.Item>

            <Dropdown.Item
              id='orders'
              textValue='Orders'
              className='rounded-xs'>
              <MenuItemContent
                icon='box'
                label='Orders'
                description='Track and review recent purchases'
              />
            </Dropdown.Item>

            <Dropdown.Item id='theme' textValue='Theme' className='rounded-xs'>
              <MenuItemContent
                icon='toggle-theme'
                label={isDarkMode ? 'Light mode' : 'Dark mode'}
              />
            </Dropdown.Item>

            {canOpenMasterMonitor ? (
              <Dropdown.Item
                id='master-monitor'
                textValue='Master Monitor'
                className='rounded-xs'>
                <MenuItemContent
                  icon='monitor'
                  label='Master Monitor'
                  endContent={<MenuPill tone='brand'>⌘⇧M</MenuPill>}
                />
              </Dropdown.Item>
            ) : null}

            {isStaff ? (
              <Dropdown.Item
                id='admin'
                textValue='Admin'
                className='rounded-xs'>
                <MenuItemContent
                  icon='settings'
                  label='Admin'
                  endContent={<MenuPill tone='brand'>Staff</MenuPill>}
                />
              </Dropdown.Item>
            ) : null}
          </Dropdown.Section>

          <Dropdown.Section aria-label='Session'>
            <Dropdown.Item
              id='logout'
              textValue='Sign out'
              variant='danger'
              className='rounded-xs'>
              <MenuItemContent icon='signout' label='Sign out' />
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
    <div className='flex min-w-0 items-center gap-3 py-0.5 w-full'>
      <MenuGlyph icon={icon} tone={tone} iconClassName={iconClassName} />
      <div className='flex items-center justify-between w-full'>
        <div className='min-w-0 flex-1 -space-y-1'>
          <div className='font-clash truncate text-base font-medium tracking-tight'>
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
        'flex w-10 h-8 items-center justify-center text-foreground/75',
        tone === 'brand' && 'border-brand/15 bg-brand/10 text-brand',
        tone === 'danger' && 'border-danger-soft bg-danger/10 text-danger',
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
        'inline-flex min-w-6 items-center justify-center rounded-sm px-1 py-px text-xs font-clash font-medium leading-none uppercase tracking-wide',
        tone === 'brand'
          ? 'bg-brand text-white shadow-sm'
          : 'bg-foreground/10 text-foreground/70',
      )}>
      {children}
    </span>
  )
}
