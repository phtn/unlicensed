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
      <header className='fixed top-0 left-0 right-0 z-100 bg-black backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-6 py-3 flex items-center justify-between'>
          <Link
            href={'/'}
            className='w-72 flex items-center gap-1 text-sm md:text-base font-space text-gray-200'>
            <span id='unlicensed-logo' className='text-teal-300 text-3xl'>
              ●
            </span>
            <div className='hidden lg:flex tracking-tighter lg:tracking-tight font-fugaz text-lg'>
              {children ?? 'unlicensed'}
            </div>
          </Link>
          <nav className='flex items-center justify-center w-full'>
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
          <div className='flex w-72 items-center justify-between'>
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
              variant='faded'
              key={`cart-badge-${cartItemCount}`}
              content={
                cartItemCount > 0 ? (
                  <div className='leading-none flex items-center justify-center font-space font-medium tracking-tighter rounded-full py-0.5 px-0.5 md:mx-0 text-sm text-white'>
                    <span className=' leading-none'>{cartItemCount}</span>
                  </div>
                ) : undefined
              }
              isInvisible={cartItemCount === 0}
              className='border border-teal-300 px-1 bg-[#19191c]'
              classNames={{
                base: 'aspect-square border-none size-8 text-xl rounded-full flex items-center justify-center',
              }}
              shape='circle'>
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
                        src={user.photoURL || undefined}
                        name={user.displayName || user.email || 'U'}
                      />
                    </DropdownTrigger>
                    <DropdownMenu aria-label='User menu'>
                      <DropdownItem key='profile' textValue='Profile'>
                        <div className='flex flex-col'>
                          <p className='font-semibold'>
                            {user.displayName || 'User'}
                          </p>
                          <p className='text-xs text-color-muted'>
                            {user.email}
                          </p>
                        </div>
                      </DropdownItem>
                      <DropdownItem
                        key='logout'
                        color='danger'
                        onPress={handleLogout}>
                        Logout
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                ) : (
                  <Icon
                    name='re-up.ph'
                    onClick={onOpen}
                    className='size-4 text-white'
                  />
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
