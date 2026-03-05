'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {CartDrawer} from '@/components/store/cart-drawer'
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
import {motion} from 'motion/react'
import {useTheme} from 'next-themes'
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
          <Link
            href={'/lobby'}
            onMouseEnter={handleHomeMouseEnter}
            onMouseLeave={handleHomeMouseLeave}
            className='group relative flex items-center justify-start min-w-12 md:w-36 h-10 md:h-12 overflow-hidden pl-1  dark:text-white text-dark-table hover:text-brand active:text-brand'>
            <motion.div
              initial={{y: 12, opacity: 0, scale: 0}}
              animate={{
                y: hovered ? 0 : 0,
                opacity: hovered ? 1 : 0,
                scale: hovered ? 0.8 : 0,
              }}
              exit={{y: -12, opacity: 0, scale: 0}}
              className='hidden md:flex absolute size-7 md:size-10 bg-white dark:bg-brand aspect-square rounded-full'
            />
            <div
              className={cn(
                'dark:bg-black/10 group-hover:backdrop-blur-none rounded-full',
              )}>
              <Icon
                name='rapid-fire-logo'
                className={cn('h-8 md:h-10 w-auto relative text-white', {
                  'text-dark-table dark:text-white dark:group-hover:text-brand':
                    !inStoreLobby,
                  'text-dark-table dark:text-white .':
                    !isMobile && scrollY >= 710,
                  'text-dark-table dark:text-white _':
                    isMobile && scrollY >= 400,
                })}
              />
            </div>
          </Link>

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
                'hidden group text-sm lg:text-lg text-gray-100 hover:text-brand md:flex items-center font-clash font-semibold space-x-1',
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
            {/* Cart badge - automatically updates via Convex reactivity */}
            {/*
              IMPORTANT: This badge is in a parallel route slot (@navbar), but it shares
              the same ConvexProvider as the main content. When items are added to cart
              in the product page (main content), the cartItemCount query automatically
              updates, and this component re-renders with the new count - NO PAGE REFRESH NEEDED.

              Reactivity Flow:
              1. User clicks "Add to Cart" on product page (main content slot)
              2. addItem() calls Convex mutation (addToCart)
              3. Convex database updates
              4. All subscribed queries update automatically (including cartItemCount)
              5. Nav component re-renders with new cartItemCount value
              6. Badge displays updated count immediately

              Key prop ensures Badge re-renders when cartItemCount changes, which is
              important for HeroUI Badge component reactivity.
            */}
            <Badge
              size='sm'
              variant='shadow'
              key={`cart-badge-${cartItemCount}`}
              content={
                cartItemCount > 0 ? (
                  <div
                    suppressHydrationWarning
                    className='flex items-center justify-center rounded-full py-0.5 px-0.5 md:mx-0 size-5 aspect-square'>
                    <span className='font-okxs font-semibold text-base text-white leading-none'>
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
                className='capitalize'
                // style={{color: scrollY >= 710 ? '#373945' : undefined}}
                variant='light'
                onPress={onCartDrawerOpen}>
                <Icon
                  name='bag-solid'
                  style={{
                    color:
                      !isMobile && scrollY >= 710
                        ? '#373945'
                        : scrollY <= 400
                          ? undefined
                          : '#373945',
                  }}
                  className={cn('size-6 text-white', {
                    'text-dark-table dark:text-white': !inStoreLobby,
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
              <Icon
                name='user'
                onClick={onOpen}
                className='text-white size-5'
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
