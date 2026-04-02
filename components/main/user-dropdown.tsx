'use client'

import { api } from '@/convex/_generated/api'
import { Icon, IconName } from '@/lib/icons'
import {
    Avatar,
    Badge,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    Link,
    Tooltip,
} from '@heroui/react'
import { useQuery } from 'convex/react'
import { User } from 'firebase/auth'
import { useRouter } from 'next/navigation'

interface UserDropdownProps {
  user: User
  loading: boolean
  isStaff: boolean
  onLogout: VoidFunction
  onThemeToggle: VoidFunction
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

  return (
    <Dropdown
      placement='bottom-end'
      classNames={{
        content: 'bg-sidebar dark:bg-white backdrop-blur-xl rounded-sm',
        base: 'rounded-sm',
        trigger:
          ' outline-0 focus-visible:ring-0 focus-visible:outline-2! focus-visible:outline-brand!',
      }}>
      <DropdownTrigger disabled={loading}>
        {loading ? (
          <Icon
            name='spinners-ring'
            className='size-7 bg-foreground/10 rounded-full'
          />
        ) : (
          <Avatar
            size='sm'
            className='cursor-pointer border-2 border-white hover:border-brand dark:hover:border-white shadow-inner hover:shadow-white'
            src={user.photoURL ?? undefined}
            name={user.displayName ?? user.email ?? 'U'}
          />
        )}
      </DropdownTrigger>
      <DropdownMenu aria-label='user-menu' className='p-1 bg-transparent'>
        <DropdownItem
          key='profile'
          textValue={`Account ${user.displayName ?? user.email ?? 'User'}`}
          onPress={() => {
            void router.push('/account')
          }}
          variant='flat'
          classNames={{
            title: 'text-foreground/90 font-polysans',
            base: 'hover:bg-alum/0 bg-background/0 dark:hover:bg-alum/10 dark:bg-white focus-visible:ring-1 outline-none',
          }}>
          <div className='flex items-center justify-between h-12 px-1'>
            <div className='space-y-0.5'>
              <p className='leading-none text-lg font-polysans dark:text-background'>
                {user.displayName?.split(' ')[0] ?? 'User'}
              </p>
              <p className='leading-none text-xs font-light tracking-[0.15em] font-brk uppercase dark:text-background'>
                {user.displayName?.split(' ').pop() ?? 'Last'}
              </p>
            </div>

            <div className='flex flex-col justify-center items-center -space-y-1'>
              <Icon
                name='user-setting-line'
                className='size-5 text-foreground dark:text-background opacity-80'
              />
              <p className='text-[6px] font-light tracking-widest font-brk dark:text-background uppercase'>
                Account
              </p>
            </div>
          </div>
        </DropdownItem>
        <DropdownSection className='hover:bg-white/0'>
          <DropdownItem
            key='quick-links'
            isReadOnly
            variant='light'
            textValue='Quick links'
            startContent={
              <JustTheTip
                id='updates'
                icon='bell'
                tip='alerts'
                offset={1}
                as={'div'}
                onPress={undefined}
              />
            }
            endContent={
              isStaff && (
                <JustTheTip
                  id='admin'
                  as={Link}
                  href='/admin'
                  icon='sunflower-line'
                  tip='admin'
                />
              )
            }
            className='hover:bg-white/80'
            classNames={{
              title: 'text-foreground/90',
              base: ' bg-white hover:bg-white/80 dark:bg-background/60 dark:hover:bg-background/70 gap-x-4',
            }}>
            <div className='flex items-center gap-4 w-fit'>
              <Badge
                size='sm'
                key={`chat-badge-${unreadCount ?? 0}`}
                content={
                  (unreadCount ?? 0) > 0 ? (
                    <span className='font-clash font-medium text-white leading-none'>
                      {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                    </span>
                  ) : undefined
                }
                isInvisible={(unreadCount ?? 0) === 0}
                classNames={{
                  badge:
                    'absolute top-2.5 right-2.5 min-w-5 h-5 w-auto flex items-center justify-center aspect-square rounded-full border-1 border-foreground shadow-sm bg-brand',
                }}>
                <JustTheTip
                  id='messages'
                  icon='chat'
                  tip='messages'
                  offset={1}
                  as={Link}
                  href='/account/chat'
                />
              </Badge>

              <JustTheTip
                id='theme-toggle'
                icon='toggle-theme'
                tip='theme'
                offset={1}
                onPress={onThemeToggle}
              />
            </div>
          </DropdownItem>
        </DropdownSection>

        <DropdownSection className='w-full flex items-center justify-end'>
          <DropdownItem
            key='logout'
            textValue='Sign out'
            onPress={onLogout}
            title='sign out'
            endContent={
              <Icon name='signout' className='size-5 rotate-90 opacity-90' />
            }
            classNames={{
              base: 'font-brk px-2.5 rounded-md w-full hover:bg-background/20 dark:text-background/70',
            }}
          />
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}

type JustTheTipAs = 'button' | 'div' | typeof Link

interface JustTheTipProps {
  id: string
  icon: IconName
  onPress?: VoidFunction
  as?: JustTheTipAs
  href?: string
  tip: string
  offset?: number
}

const JustTheTip = ({
  id,
  icon,
  onPress,
  as,
  href,
  tip,
  offset = 1,
}: JustTheTipProps) => {
  return (
    <Tooltip
      id={id}
      content={tip}
      offset={offset}
      radius='none'
      className='font-okxs text-sm max-h-7 text-white dark:border border-white/60 dark:border-background/60 rounded-sm shadow-xl px-2 bg-dark-table'>
      <Button
        as={as}
        isIconOnly
        href={href}
        radius='full'
        variant='light'
        onPress={onPress}
        className='h-10'>
        <Icon name={icon} className='size-5' />
      </Button>
    </Tooltip>
  )
}
