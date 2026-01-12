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
import {useTheme} from 'next-themes'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useCallback, useMemo} from 'react'
import {ThemeToggle} from '../ui/theme-toggle'

interface NavProps {
  children?: React.ReactNode
}

export const Nav = ({children}: NavProps) => {
  const {user, loading: authLoading} = useAuth()
  const {setTheme} = useTheme()
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

  return (
    <>
      <header className='fixed z-9999 top-0 left-0 right-0 bg-black backdrop-blur-sm h-12 lg:h-16 xl:h-20 2xl:h-24'>
        <div className='w-full max-w-7xl mx-auto xl:px-0 px-4 flex items-center justify-between h-full'>
          <Link
            href={'/lobby'}
            className='md:w-36 h-12 overflow-hidden pl-1 flex items-center justify-start relative'>
            <Icon
              name='rapid-fire-logo'
              className='h-10 w-auto dark:text-white text-white'
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
                className='hidden text-sm lg:text-lg text-gray-100 hover:text-brand md:flex items-center font-polysans font-semibold space-x-1'>
                <Icon
                  name='play-solid'
                  className='size-4 rotate-45 opacity-80'
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
                          title: 'text-foreground/90 font-polysans',
                          base: 'hover:bg-transparent',
                        }}>
                        <div className='flex flex-col'>
                          <p className='text-base font-normal'>
                            {user.displayName || 'User'}
                          </p>
                          <p className='text-xs font-light font-nito opacity-60'>
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
                            base: 'hover:bg-transparent dark:bg-dark-table/30',
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
                      <DropdownItem
                        key='theme'
                        title='Theme'
                        onPress={() => setTheme('dark')}>
                        <ThemeToggle variant='icon' />
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                ) : (
                  <Icon name='user' onClick={onOpen} className='text-white' />
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
