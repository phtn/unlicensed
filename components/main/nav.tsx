'use client'

import {AuthModal} from '@/components/auth/auth-modal'
import {CartDrawer} from '@/components/store/cart-drawer'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {useCart} from '@/hooks/use-cart'
import {logout} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
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
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useCallback, useEffect} from 'react'
import {ThemeToggle} from '../ui/theme-toggle'

interface NavProps {
  children?: React.ReactNode
}

export const Nav = ({children}: NavProps) => {
  const {user, loading: authLoading} = useAuth()
  const {cartItemCount, isAuthenticated} = useCart()
  const {isOpen, onOpen, onClose} = useDisclosure()
  const route = usePathname().split('/').pop()
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

  const staff = useQuery(
    api.staff.q.getStaffByEmail,
    user?.email ? {email: user.email} : 'skip',
  )
  const isAdmin =
    staff?.accessRoles.includes('admin') ||
    staff?.accessRoles.includes('manager')

  return (
    <>
      <header className='fixed top-0 left-0 right-0 z-60 bg-black backdrop-blur-sm h-12 lg:h-16 xl:h-20 2xl:h-24'>
        <div className='w-full max-w-7xl mx-auto xl:px-0 px-4 flex items-center justify-between h-full'>
          <Link
            href={'/'}
            className='md:w-72 h-12 overflow-hidden pl-1 flex items-center justify-start relative'>
            <Icon
              name='rapid-fire'
              className='h-36 w-auto dark:text-brand text-brand'
            />
          </Link>
          <nav className={cn('flex items-center justify-center w-fit')}>
            {route === 'strain-finder' ? (
              <div className='hidden md:flex font-polysans font-normal bg-white text-base text-black px-4 py-0.5 rounded-full'>
                Strain Finder
              </div>
            ) : (
              <Link
                href={'/'}
                className='hidden text-sm lg:text-lg text-gray-100 hover:text-brand md:flex font-fugaz'>
                Shop
              </Link>
            )}
            {children}
          </nav>
          <div className='flex w-fit gap-5 md:w-72 items-center justify-between'>
            <ThemeToggle variant='icon' />

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
                    <span className='font-space font-semibold text-base text-white leading-none'>
                      {cartItemCount}
                    </span>
                  </div>
                ) : undefined
              }
              isInvisible={cartItemCount === 0}
              className='border-[1.5px] border-black px-0.5 bg-brand translate-x-3.5 -translate-y-1.5'
              classNames={{
                base: 'aspect-square border-none size-8 text-xl rounded-xs flex items-center justify-center',
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

            {!authLoading && (
              <>
                {user ? (
                  <Dropdown placement='bottom-end'>
                    <DropdownTrigger>
                      <Avatar
                        size='sm'
                        className='cursor-pointer border-2 border-neutral-100 hover:border-white dark:hover:border-white shadow-inner'
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

                      {isAdmin ? (
                        <DropdownItem
                          key='admin'
                          as={Link}
                          href={'/admin'}
                          variant='flat'
                          classNames={{
                            title: 'text-foreground/90',
                            base: 'hover:bg-transparent dark:bg-slate-800',
                          }}>
                          <div className='flex items-center space-x-2'>
                            <Icon name='certificate' className='size-8' />
                            <p className='text-base font-space font-semibold tracking-tighter dark:text-limited'>
                              Admin
                            </p>
                          </div>
                        </DropdownItem>
                      ) : null}

                      <DropdownItem
                        key='logout'
                        onPress={handleLogout}
                        title='Logout'
                        className=''
                      />
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

/*
<motion.div
              className='h-[22px] w-[135.33px] mask-[url("/svg/rapid-fire.svg")] mask-contain'
              animate={{
                background: [
                  'linear-gradient(to right, oklch(0.784 0.21 326.75) 20%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 40%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 60%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 80%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 90%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 100%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 90%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 80%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 60%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 40%, rgb(255, 250, 250))',
                  // 'linear-gradient(to right, oklch(0.784 0.21 326.75) 20%, rgb(255, 250, 250))',
                ],
              }}
              transition={{
                duration: 4,
                repeat: 3,
                ease: 'easeInOut',
              }}
            />
*/
