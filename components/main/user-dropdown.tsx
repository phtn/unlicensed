import {Icon, IconName} from '@/lib/icons'
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Link,
  Tooltip,
} from '@heroui/react'
import {User} from 'firebase/auth'

interface UserDropdownProps {
  user: User
  loading: boolean
  isAdmin: boolean
  onLogout: VoidFunction
  onThemeToggle: VoidFunction
}

export const UserDropdown = ({
  user,
  loading,
  isAdmin,
  onLogout,
  onThemeToggle,
}: UserDropdownProps) => {
  return (
    <Dropdown
      placement='bottom-end'
      classNames={{
        content: 'bg-sidebar dark:bg-white backdrop-blur-xl rounded-xl',
        base: 'rounded-md',
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
          as={Link}
          href='/account'
          key='profile'
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
            as={'div'}
            variant='light'
            startContent={
              <JustTheTip
                id='updates'
                icon='bell'
                tip='updates'
                offset={6}
                as={'div'}
                onPress={undefined}
              />
            }
            endContent={
              isAdmin && (
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
              <JustTheTip
                id='messages'
                icon='chat'
                tip='messages'
                offset={6}
                as={Link}
                href='/account/chat'
              />

              <JustTheTip
                id='theme-toggle'
                icon='toggle-theme'
                tip='theme'
                offset={6}
                onPress={onThemeToggle}
              />
            </div>
          </DropdownItem>
        </DropdownSection>

        <DropdownSection className='w-full flex items-center justify-end'>
          <DropdownItem
            key='logout'
            // startContent={<Icon name='rapid-fire-logo-2' className='size-6' />}
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

/** Narrow type for Button's polymorphic `as` to avoid "union too complex" */
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
  offset = 6,
}: JustTheTipProps) => {
  return (
    <Tooltip
      id={id}
      content={tip}
      offset={offset}
      radius='none'
      className='font-okxs text-base max-h-7 text-white border border-white/60 dark:border-background/60 rounded-sm shadow-xl px-2 bg-dark-table'>
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
