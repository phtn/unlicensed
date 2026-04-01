'use client'

import {useTheme} from '@/components/ui/theme-provider'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {useMobile} from '@/hooks/use-mobile'
import {useScrollY} from '@/hooks/use-scroll-y'
import {logout} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Badge, Button, useDisclosure} from '@heroui/react'
import {useQuery} from 'convex/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useCallback, useMemo, useState} from 'react'
import {NavMenu} from '../expermtl/nav-menu'
import {UserDropdown} from './user-dropdown'

const AuthModal = dynamic(
  () =>
    import('@/components/auth/auth-modal').then((module) => module.AuthModal),
  {ssr: false},
)

const CartDrawer = dynamic(
  () =>
    import('@/components/store/cart-drawer').then((module) => module.CartDrawer),
  {ssr: false},
)

const preloadAuthModal = () => import('@/components/auth/auth-modal')
const preloadCartDrawer = () => import('@/components/store/cart-drawer')

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
  const [hasOpenedAuthModal, setHasOpenedAuthModal] = useState(false)
  const [hasOpenedCartDrawer, setHasOpenedCartDrawer] = useState(false)
  const [hovered, setHovered] = useState(false)

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

  const handleAuthOpen = useCallback(() => {
    setHasOpenedAuthModal(true)
    onOpen()
  }, [onOpen])

  const handleCartOpen = useCallback(() => {
    setHasOpenedCartDrawer(true)
    onCartDrawerOpen()
  }, [onCartDrawerOpen])

  const handleCartDrawerChange = useCallback(
    (open: boolean) => {
      if (open) {
        setHasOpenedCartDrawer(true)
        onCartDrawerOpen()
        return
      }

      onCartDrawerClose()
    },
    [onCartDrawerClose, onCartDrawerOpen],
  )

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
            'bg-white/70 dark:bg-black/70 backdrop-blur-md ': isMobile && scrollY >= 400,
            'dark:bg-black/70 dark:text-white dark:backdrop-blur-px bg-white/70 backdrop-blur-3xl':
              !inStoreLobby,
          },
        )}
        data-scroll-y={scrollY}>
        <div className='w-full max-w-7xl mx-auto xl:px-0 px-4 flex items-center justify-start md:justify-between h-full'>
          <div className='min-w-12 md:w-36'>
            <Link
              href='/lobby'
              aria-label='Go to the Rapid Fire storefront'
              onMouseEnter={handleHomeMouseEnter}
              onMouseLeave={handleHomeMouseLeave}
              className='group relative flex h-11 min-h-11 items-center justify-start overflow-hidden rounded-full px-1.5 text-dark-table outline-0 active:text-brand hover:text-brand focus-visible:bg-brand dark:text-white md:h-12 md:w-fit'>
              <div
                className={cn(
                  'absolute hidden size-7 aspect-square rounded-full bg-brand transition-all duration-300 ease-out md:flex md:size-10',
                  hovered ? 'scale-[0.8] opacity-100' : 'scale-0 opacity-0',
                  {
                    'bg-brand':
                      (!isMobile && scrollY <= 710) ||
                      (isMobile && scrollY <= 400),
                  },
                )}
              />
              <div className='rounded-full dark:bg-black/10 dark:group-hover:text-white group-hover:backdrop-blur-none'>
                <Icon
                  name='rapid-fire-logo'
                  className={cn(
                    'relative h-8 w-auto text-white transition-colors duration-300 dark:group-hover:text-white md:h-10',
                    {
                      'text-dark-table dark:text-white dark:group-hover:text-white': !inStoreLobby,
                      'text-dark-table dark:text-white group-hover:text-white .':
                        !isMobile && scrollY >= 710,
                      'text-dark-table dark:text-white _': isMobile && scrollY >= 400,
                    },
                  )}
                />
              </div>
            </Link>
          </div>
          <nav className='flex items-center justify-center space-x-4 md:w-fit w-full'>
            <div className='portrait:flex-1 portrait:px-2'>
              <NavMenu
                scrollY={scrollY}
                isMobile={isMobile}
                inStoreLobby={inStoreLobby}
              />
            </div>
            <div className='sm:hidden portrait:flex portrait:w-full' />
            <Link
              href='/lobby/category'
              className={cn(
                'hidden rounded-xs px-2 text-sm font-clash font-semibold text-gray-100 outline-0 hover:text-brand focus-visible:bg-brand focus-visible:ring-0 md:flex md:items-center md:space-x-1 lg:text-lg',
                {
                  'text-dark-table dark:text-white': !inStoreLobby,
                  'text-dark-table dark:text-white .': !isMobile && scrollY >= 710,
                  'text-dark-table dark:text-white _': isMobile && scrollY >= 400,
                },
              )}>
              <span className='dark:drop-shadow-black group-hover:drop-shadow-sm'>
                Shop
              </span>
            </Link>
            {children}
          </nav>
          <div className='flex w-fit items-center justify-between gap-5 md:w-36'>
            <Badge
              size='sm'
              variant='shadow'
              key={`cart-badge-${cartItemCount}`}
              content={
                cartItemCount > 0 ? (
                  <div
                    suppressHydrationWarning
                    className='flex size-5 aspect-square items-center justify-center rounded-full px-0.5 py-0.5 md:mx-0'>
                    <span className='font-okxs text-base font-semibold leading-none text-white'>
                      {cartItemCount}
                    </span>
                  </div>
                ) : undefined
              }
              isInvisible={cartItemCount === 0}
              className='px-[0.5px]'
              classNames={{
                badge:
                  'aspect-square size-6 text-base translate-x-2.5 -translate-y-1 rounded-xs flex items-center justify-center rounded-sm border-0.5 dark:border-white/90 shadow-sm shadow-dark-table/50 backdrop-blur-2xl bg-brand',
              }}
              shape='rectangle'>
              <Button
                isIconOnly
                data-cart-icon
                aria-label='Open cart'
                variant='light'
                className='size-11 min-h-11 min-w-11 capitalize outline-0 focus-visible:ring-0 focus-visible:outline-2! focus-visible:outline-brand!'
                onPointerEnter={() => {
                  void preloadCartDrawer()
                }}
                onFocus={() => {
                  void preloadCartDrawer()
                }}
                onPress={handleCartOpen}>
                <Icon
                  name='bag-solid'
                  className={cn('size-6 text-white', {
                    'text-dark-table dark:text-white': !inStoreLobby,
                    'text-dark-table dark:text-white .': !isMobile && scrollY >= 710,
                    'text-dark-table dark:text-white _': isMobile && scrollY >= 400,
                  })}
                />
              </Button>
            </Badge>

            {user ? (
              <UserDropdown
                loading={authLoading}
                user={user}
                isStaff={isStaff}
                onThemeToggle={handleToggleTheme}
                onLogout={handleLogout}
              />
            ) : (
              <Button
                isIconOnly
                variant='light'
                aria-label='Open login dialog'
                className='size-11 min-h-11 min-w-11 capitalize outline-0 focus-visible:ring-0 focus-visible:outline-2! focus-visible:outline-brand!'
                onPointerEnter={() => {
                  void preloadAuthModal()
                }}
                onFocus={() => {
                  void preloadAuthModal()
                }}
                onPress={handleAuthOpen}>
                <Icon
                  name='user'
                  className={cn('size-6 text-white', {
                    'text-dark-table dark:text-white': !inStoreLobby,
                    'text-dark-table dark:text-white .': !isMobile && scrollY >= 710,
                    'text-dark-table dark:text-white _': isMobile && scrollY >= 400,
                  })}
                />
              </Button>
            )}
          </div>
        </div>
      </header>
      {hasOpenedAuthModal ? (
        <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
      ) : null}
      {hasOpenedCartDrawer ? (
        <CartDrawer
          open={isCartDrawerOpen}
          onOpenChange={handleCartDrawerChange}
        />
      ) : null}
    </div>
  )
}
