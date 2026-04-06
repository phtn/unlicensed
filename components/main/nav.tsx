'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {CartDrawer} from '@/components/store/cart-drawer'
import {useTheme} from '@/components/ui/theme-provider'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {useDisclosure} from '@/hooks/use-disclosure'
import {useMobile} from '@/hooks/use-mobile'
import {useScrollY} from '@/hooks/use-scroll-y'
import {logout} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Badge, Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import {motion} from 'motion/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useCallback, useMemo, useState} from 'react'
import {NavMenu} from '../expermtl/nav-menu'
import {UserDropdown} from './user-dropdown'

interface NavProps {
  children?: React.ReactNode
}

export const Nav = ({children}: NavProps) => {
  const scrollY = useScrollY()
  const {user, loading: authLoading} = useAuth()
  const isMobile = useMobile()
  const pathname = usePathname()
  const inStoreLobby = pathname.split('/').pop() === 'lobby'
  const {setTheme, theme} = useTheme()
  const {cartItemCount} = useCart()
  const {isOpen, onOpen, onClose} = useDisclosure()
  const {
    isOpen: isCartDrawerOpen,
    onOpen: onCartDrawerOpen,
    onClose: onCartDrawerClose,
  } = useDisclosure()

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      onClose()
    }
  }, [onClose])

  const staff = useQuery(
    api.staff.q.getStaffByEmail,
    user?.email ? {email: user.email} : 'skip',
  )
  const isStaff = useMemo(
    () => !!staff && staff.active && staff.accessRoles.length > 0,
    [staff],
  )

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [setTheme, theme])

  const [hovered, setHovered] = useState(false)
  const handleHomeMouseEnter = useCallback(() => {
    setHovered(true)
  }, [])

  const handleHomeMouseLeave = useCallback(() => {
    setHovered(false)
  }, [])

  return (
    <div>
      <header
        className={cn(
          'fixed z-9999 top-0 left-0 right-0 bg-linear-to-b from-transparent to-transparent dark:from-black/15 dark:via-black/10 dark:to-transparent h-14 lg:h-16 xl:h-20 2xl:h-24',
          {
            'bg-white/70 dark:bg-black/70 backdrop-blur-md': scrollY >= 710,
            'bg-white/70 dark:bg-black/70 backdrop-blur-md ':
              isMobile && scrollY >= 400,
            'dark:bg-black/70 dark:text-white dark:backdrop-blur-px bg-white/70 backdrop-blur-3xl':
              !inStoreLobby,
          },
        )}
        data-scroll-y={scrollY}>
        <div className='w-full max-w-7xl mx-auto xl:px-0 px-4 flex items-center justify-start md:justify-between h-full'>
          <div className='min-w-12 md:w-36'>
            <Link
              id='home'
              href={'/lobby'}
              onMouseEnter={handleHomeMouseEnter}
              onMouseLeave={handleHomeMouseLeave}
              className='group relative flex items-center justify-start rounded-full h-10 md:w-fit md:h-12 overflow-hidden px-1  dark:text-white text-dark-table hover:text-brand active:text-brand outline-0 focus-visible:bg-brand'>
              <motion.div
                initial={{y: 12, opacity: 0, scale: 0}}
                animate={{
                  y: hovered ? 0 : 0,
                  opacity: hovered ? 1 : 0,
                  scale: hovered ? 0.8 : 0,
                }}
                exit={{y: -12, opacity: 0, scale: 0}}
                className={cn(
                  'hidden md:flex absolute size-7 md:size-10 bg-brand aspect-square rounded-full',
                  {
                    'bg-brand':
                      (!isMobile && scrollY <= 710) ||
                      (isMobile && scrollY <= 400),
                  },
                )}
              />
              <div
                className={cn(
                  'dark:bg-black/10 group-hover:backdrop-blur-none rounded-full',
                )}>
                <Icon
                  name='rapid-fire-logo'
                  className={cn(
                    'h-8 md:h-10 w-auto relative text-white dark:group-hover:text-white transition-colors duration-300',
                    {
                      'text-dark-table dark:text-white dark:group-hover:text-white':
                        !inStoreLobby,
                      'text-dark-table dark:text-white group-hover:text-white .':
                        !isMobile && scrollY >= 710,
                      'text-dark-table dark:text-white _':
                        isMobile && scrollY >= 400,
                    },
                  )}
                />
              </div>
            </Link>
          </div>
          <nav
            className={cn(
              'flex items-center justify-center md:w-fit w-full space-x-4',
            )}>
            <div className='portrait:flex-1 portrait:px-2'>
              <NavMenu
                scrollY={scrollY}
                isMobile={isMobile}
                inStoreLobby={inStoreLobby}
              />
            </div>
            <div className='sm:hidden portrait:flex portrait:w-full' />
            <Link
              href={'/lobby/category'}
              className={cn(
                'hidden rounded-xs px-2 h-7 group text-sm lg:text-lg text-gray-100 hover:text-brand md:flex items-center font-clash font-semibold space-x-1  outline-0 focus-visible:bg-brand focus-visible:ring-0',
                {
                  'text-dark-table dark:text-white': !inStoreLobby,
                  'text-dark-table dark:text-white .':
                    !isMobile && scrollY >= 710,
                  'text-dark-table dark:text-white _':
                    isMobile && scrollY >= 400,
                },
              )}>
              <span className='group-hover:drop-shadow-sm dark:drop-shadow-black'>
                Shop
              </span>
            </Link>
            {children}
          </nav>
          <div className='flex w-fit gap-5 md:w-36 items-center justify-between'>
            <Badge.Anchor>
              <Button
                variant='ghost'
                id='cart-drawer-trigger'
                className='capitalize outline-0 focus-visible:ring-0 aspect-square focus-visible:outline-2! focus-visible:outline-brand! hover:bg-transparent'
                onPress={onCartDrawerOpen}>
                <Icon
                  name='bag-solid'
                  className={cn('size-6 sm:size-7 text-white', {
                    'text-dark-table dark:text-white': !inStoreLobby,
                    'text-dark-table dark:text-white .':
                      !isMobile && scrollY >= 710,
                    'text-dark-table dark:text-white _':
                      isMobile && scrollY >= 400,
                  })}
                />
              </Button>
              {cartItemCount > 0 && (
                <Badge
                  key={`cart-badge-${cartItemCount}`}
                  content={`${cartItemCount}`}
                  className='-translate-x-2.5 bg-brand w-5.5 rounded-lg border flex items-center justify-center border-white font-okxs font-semibold text-sm text-white leading-none flex items-center justify-center h-2!'>
                  {cartItemCount}
                </Badge>
              )}
            </Badge.Anchor>

            {user ? (
              <UserDropdown
                loading={authLoading}
                user={user}
                isStaff={isStaff}
                onThemeToggle={handleToggleTheme}
                onLogout={handleLogout}
              />
            ) : (
              <Icon
                name='user'
                onClick={onOpen}
                className={cn(
                  'size-6 text-white focus-visible:outline-2! focus-visible:outline-brand!',
                  {
                    'text-dark-table dark:text-white': !inStoreLobby,
                    'text-dark-table dark:text-white .':
                      !isMobile && scrollY >= 710,
                    'text-dark-table dark:text-white _':
                      isMobile && scrollY >= 400,
                  },
                )}
              />
            )}
          </div>
        </div>
      </header>
      <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
      <CartDrawer
        open={isCartDrawerOpen}
        onOpenChange={(open) => {
          if (open) {
            onCartDrawerOpen()
          } else {
            onCartDrawerClose()
          }
        }}
      />
    </div>
  )
}
