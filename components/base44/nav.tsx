'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {CartDrawer} from '@/components/store/cart-drawer'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {logout} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useDisclosure,
} from '@heroui/react'
import Link from 'next/link'
import {useCallback, useEffect} from 'react'
import {ThemeToggle} from '../ui/theme-toggle'

interface NavProps {
  children?: React.ReactNode
}

export const Nav = ({children}: NavProps) => {
  const {user, loading: authLoading} = useAuth()
  // cartItemCount automatically updates via Convex reactivity when items are added/removed
  // No manual refresh needed - Convex queries subscribe and update in real-time
  const {cartItemCount, isAuthenticated} = useCart()
  const {isOpen, onOpen, onClose} = useDisclosure()
  const {
    isOpen: isCartDrawerOpen,
    onOpen: onCartDrawerOpen,
    onClose: onCartDrawerClose,
  } = useDisclosure()

  // Debug: Log cart count changes to verify reactivity is working
  // This helps verify that Convex queries are updating in real-time
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Nav] Cart item count updated:', cartItemCount, {
        isAuthenticated,
        timestamp: Date.now(),
      })
    }
  }, [cartItemCount, isAuthenticated])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      onClose()
    }
  }, [onClose])

  return (
    <>
      <header className='fixed top-0 left-0 right-0 z-40 bg-black backdrop-blur-sm'>
        <div className='w-full max-w-7xl mx-auto xl:px-0 px-4 py-3 flex items-center justify-between'>
          <Link
            href={'/'}
            className='hidden md:w-72 md:flex items-center gap-1 text-sm md:text-base font-space text-gray-200'>
            <span id='unlicensed-logo' className='text-teal-300 text-3xl'>
              ●
            </span>
            <div className='lg:flex tracking-tighter lg:tracking-tight font-fugaz text-lg'>
              {children ?? 'unlicensed'}
            </div>
          </Link>
          <nav className='flex items-center justify-center md:w-full'>
            <Link
              href={'/'}
              className='text-sm lg:text-lg text-gray-100 hover:text-secondary font-fugaz'>
              Shop
            </Link>
            {/*<Link
              href={'#'}
              className='text-sm text-gray-100 hover:text-secondary transition-colors'>
              Library
            </Link>*/}
          </nav>
          <div className='flex w-fit gap-5 md:w-72 items-center justify-between'>
            <ThemeToggle />

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
                  <div className='flex items-center justify-center rounded-full py-0.5 px-0.5 md:mx-0 size-5 aspect-square'>
                    <span className='font-space font-semibold text-base text-white leading-none'>
                      {cartItemCount}
                    </span>
                  </div>
                ) : undefined
              }
              isInvisible={cartItemCount === 0}
              className='border border-teal-500 px-0.5 bg-teal-600 translate-x-4.5 -translate-y-1.5'
              classNames={{
                base: 'aspect-square border-none size-8 text-xl rounded-xs flex items-center justify-center',
              }}
              shape='rectangle'>
              <Button
                isIconOnly
                data-cart-icon
                className='capitalize bg-black'
                onPress={onCartDrawerOpen}>
                <Icon name='bag-light' className='size-8 text-white' />
              </Button>
            </Badge>

            {!authLoading && (
              <>
                {user ? (
                  <Dropdown placement='bottom-end'>
                    <DropdownTrigger>
                      <Avatar
                        size='sm'
                        className='cursor-pointer'
                        src={user.photoURL ?? undefined}
                        name={user.displayName ?? user.email ?? 'U'}
                      />
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label='user-menu'
                      className='p-2 bg-transparent'>
                      <DropdownItem
                        as={Link}
                        href='/account'
                        key='profile'
                        variant='flat'
                        classNames={{
                          title: 'text-foreground/90',
                          base: 'hover:bg-transparent',
                        }}>
                        <div className='flex flex-col'>
                          <p className='text-base font-normal font-space'>
                            {user.displayName || 'User'}
                          </p>
                          <p className='text-xs opacity-100 font-normal font-space text-teal-600'>
                            {user.email}
                          </p>
                        </div>
                      </DropdownItem>
                      <DropdownItem
                        key='admin'
                        as={Link}
                        href={
                          user.email === 'phtn458@gmail.com'
                            ? '/admin'
                            : '#nope'
                        }
                        variant='flat'
                        classNames={{
                          title: 'text-foreground/90',
                          base: 'hover:bg-transparent',
                        }}>
                        <div className='flex flex-col'>
                          <p className='text-base font-normal font-fugaz'>
                            Secret Place
                          </p>
                        </div>
                      </DropdownItem>

                      <DropdownItem
                        key='logout'
                        onPress={handleLogout}
                        title='Logout'
                        classNames={{wrapper: 'bg-pink-500'}}
                        className='bg-black/1o hover:bg-black hover:text-white'></DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                ) : (
                  <Icon name='user' onClick={onOpen} className='text-white' />
                  // <Button
                  //   size='sm'
                  //   variant='flat'
                  //   onPress={onOpen}
                  //   className='text-sm bg-white text-black font-semibold tracking-tight'>
                  //   Sign In
                  // </Button>
                )}
              </>
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
    </>
  )
}
