'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {CartDrawer} from '@/components/store/cart-drawer'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
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
import {UserDropdown} from './user-dropdown'

interface NavProps {
  children?: React.ReactNode
}

export const Nav = ({children}: NavProps) => {
  const {user, loading: authLoading} = useAuth()
  const {setTheme, theme} = useTheme()
  const {cartItemCount} = useCart()
  const {isOpen, onOpen, onClose} = useDisclosure()
  const route = usePathname().split('/').pop()
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
  const isAdmin = useMemo(
    () => !!staff && staff.active && staff.accessRoles.includes('admin'),
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
      <header className='fixed z-9999 top-0 left-0 right-0 bg-black backdrop-blur-sm h-12 lg:h-16 xl:h-20 2xl:h-24'>
        <div className='w-full max-w-7xl mx-auto xl:px-0 px-4 flex items-center justify-between h-full'>
          <Link
            href={'/lobby'}
            onMouseEnter={handleHomeMouseEnter}
            onMouseLeave={handleHomeMouseLeave}
            className='group relative flex items-center justify-start md:w-36 h-10 md:h-12 overflow-hidden pl-1 text-white hover:text-brand shadow-inner active:text-brand'>
            <motion.div
              initial={{y: 12, opacity: 0, scale: 0}}
              animate={{
                y: hovered ? 0 : 0,
                opacity: hovered ? 1 : 0,
                scale: hovered ? 0.8 : 0,
              }}
              exit={{y: -12, opacity: 0, scale: 0}}
              className='hidden md:flex absolute size-8 md:size-10 bg-white aspect-square rounded-full'
            />
            <Icon
              name='rapid-fire-logo'
              className='h-8 md:h-10 w-auto relative'
            />
          </Link>
          <nav className={cn('flex items-center justify-center w-fit')}>
            {route === 'strain-finder' ? (
              <div className='hidden md:flex font-polysans font-normal bg-white text-base text-black px-4 py-0.5 rounded-full'>
                Strain Finder
              </div>
            ) : (
              <Link
                href={'/lobby/category'}
                className='hidden group text-sm lg:text-lg text-gray-100 hover:text-brand md:flex items-center font-polysans font-semibold space-x-1'>
                <Icon
                  name='play-solid'
                  className='size-4 rotate-45 group-hover:text-white group-hover:opacity-100 opacity-80'
                />
                <span>Shop</span>
              </Link>
            )}
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
                  'aspect-square size-6 text-base translate-x-2.5 -translate-y-1 rounded-xs flex items-center justify-center rounded-md border-1.5 dark:border-background/90 shadow-md backdrop-blur-2xl bg-brand/80',
              }}
              shape='rectangle'>
              <Button
                isIconOnly
                data-cart-icon
                className='capitalize bg-black'
                onPress={onCartDrawerOpen}>
                <Icon name='bag-solid' className='size-6 text-white' />
              </Button>
            </Badge>

            {user ? (
              <UserDropdown
                loading={authLoading}
                user={user}
                isAdmin={isAdmin}
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
