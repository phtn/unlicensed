'use client'

import {cn} from '@/lib/utils'
import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from '@heroui/react'
import {useTheme} from 'next-themes'
import {usePathname} from 'next/navigation'
import {useMemo, useState} from 'react'

type NavLink = {
  label: string
  href: string
}

const NAV_LINKS: NavLink[] = [
  {label: 'Shop', href: '/'},
  {label: 'Strain Finder', href: '/#finder'},
  {label: 'Culture', href: '/#culture'},
  {label: 'Visit', href: '/#visit'},
]

const SunIcon = () => (
  <svg aria-hidden viewBox='0 0 24 24' className='h-5 w-5'>
    <path
      fill='currentColor'
      d='M12 17.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11Zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 4c-.55 0-1-.45-1-1V1.75a1 1 0 1 1 2 0V3c0 .55-.45 1-1 1Zm0 18c-.55 0-1-.45-1-1v-1.25a1 1 0 0 1 2 0V21c0 .55-.45 1-1 1ZM4 13H2.75a1 1 0 1 1 0-2H4c.55 0 1 .45 1 1s-.45 1-1 1Zm17.25 0H20a1 1 0 1 1 0-2h1.25a1 1 0 1 1 0 2ZM6.35 7.76 5.46 6.87a1 1 0 1 1 1.42-1.41l.9.88a1 1 0 0 1-1.43 1.42Zm11.78 11.78-.88-.89a1 1 0 1 1 1.41-1.41l.89.88a1 1 0 0 1-1.42 1.42Zm-.01-13.19a1 1 0 0 1 0-1.42l.89-.88a1 1 0 0 1 1.41 1.41l-.88.89a1 1 0 0 1-1.42 0ZM7.77 17.66a1 1 0 0 1 0 1.42l-.9.9a1 1 0 1 1-1.42-1.41l.9-.9a1 1 0 0 1 1.42 0Z'
    />
  </svg>
)

const MoonIcon = () => (
  <svg aria-hidden viewBox='0 0 24 24' className='h-5 w-5'>
    <path
      fill='currentColor'
      d='M11.25 2c.41 0 .75.34.75.75 0 6.35 4.65 11.84 10.95 12.6a.75.75 0 0 1 .54 1.22A10.75 10.75 0 1 1 11.25 2Zm-.76 2.54a9.25 9.25 0 1 0 9.97 14.57c-6.04-1.29-10.77-6.42-11.39-12.7a9.2 9.2 0 0 0 1.42-1.87Z'
    />
  </svg>
)

type ThemeToggleProps = {
  variant?: 'icon' | 'menu'
  onAction?: () => void
}

const ThemeToggle = ({variant = 'icon', onAction}: ThemeToggleProps) => {
  const {setTheme, resolvedTheme} = useTheme()
  const [mounted] = useState(() => true)

  const handleToggle = () => {
    const currentTheme = resolvedTheme ?? 'dark'
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
    onAction?.()
  }

  const isThemeReady = mounted && resolvedTheme !== undefined
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Light mode' : 'Dark mode'

  if (!isThemeReady && variant === 'icon') {
    return (
      <Button
        isIconOnly
        radius='full'
        variant='flat'
        aria-label='Loading theme preference'
        className='border border-(--nav-border) bg-(--surface-highlight) text-foreground/60'
        isDisabled>
        <span className='h-4 w-4 animate-pulse rounded-full bg-current/30' />
      </Button>
    )
  }

  if (variant === 'menu') {
    return (
      <Button
        onPress={handleToggle}
        radius='full'
        variant='flat'
        className='w-full border border-(--nav-border) bg(--surface-highlight) px-4 py-3 text-base font-medium text-foreground hover:bg-(--surface-muted)'>
        {label}
      </Button>
    )
  }

  return (
    <Button
      isIconOnly
      onPress={handleToggle}
      radius='full'
      variant='flat'
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className='border border-(--nav-border) bg-(--surface-highlight) text-foreground transition duration-200 hover:bg-(--surface-muted)'>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}

export const Nav = () => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const activeHref = useMemo(() => {
    if (!pathname) return '/'
    const match = NAV_LINKS.find((link) => link.href === pathname)
    return match?.href ?? '/'
  }, [pathname])

  return (
    <Navbar
      maxWidth='xl'
      isBordered
      isBlurred={false}
      shouldHideOnScroll
      onMenuOpenChange={setIsMenuOpen}
      className='sticky top-0 z-50 border-b border-(--nav-border) bg-(--nav-background) backdrop-blur-2xl transition-colors duration-300'
      classNames={{
        wrapper: 'px-4 lg:px-8',
        item: 'data-[active=true]:text-foreground data-[active=true]:font-medium',
      }}>
      <NavbarContent className='basis-1/4 gap-4 sm:basis-1/3' justify='start'>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className='sm:hidden'
        />
        <NavbarBrand className='items-center gap-3'>
          <div className='flex h-11 w-11 font-extrabold text-xl items-center justify-center rounded-2xl border border-(--nav-border) bg-(--surface-highlight) shadow-[0_18px_40px_-28px_rgba(5,9,21,0.35) backdrop-blur-xl transition-colors duration-300'>
            U
          </div>
          <div className='flex flex-col leading-tight'>
            <span className='text-sm font-medium font-space uppercase text-color-muted'>
              Unlicensed
            </span>
            {/*<span className='text-base font-semibold text-foreground'>
              Goods
            </span>*/}
          </div>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className='hidden gap-6 text-sm font-medium sm:flex'
        justify='center'>
        {NAV_LINKS.map((link) => (
          <NavbarItem
            key={link.href}
            isActive={activeHref === link.href}
            className='relative'>
            <Link
              href={link.href}
              color='foreground'
              className={cn(
                'transition-colors',
                activeHref === link.href
                  ? 'text-foreground'
                  : 'text-color-muted hover:text-foreground/80',
              )}>
              {link.label}
            </Link>
            {activeHref === link.href ? (
              <span className='absolute -bottom-2 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-linear-to-r from-[#5f3df7] via-[#c86dd7] to-[#f6a44d]' />
            ) : null}
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent className='hidden basis-1/4 items-center justify-end gap-2 sm:flex sm:basis-1/3'>
        <ThemeToggle />
        <Button
          as={Link}
          href='/#menu'
          radius='full'
          variant='flat'
          className='border border-(--nav-border) bg-(--surface-highlight) px-5 py-2 text-sm font-medium text-foreground shadow-[0_14px_40px_-28px_rgba(12,20,45,0.38) transition duration-200 hover:bg-(--surface-muted)'>
          Browse Menu
        </Button>
        <Button
          as={Link}
          href='/signup'
          radius='full'
          variant='solid'
          className='cta-button px-6 py-2 text-sm font-semibold'>
          Join Waitlist
        </Button>
      </NavbarContent>

      <NavbarMenu
        className='pt-6 text-foreground backdrop-blur-2xl transition-colors duration-300'
        style={{backgroundColor: 'var(--nav-background)'}}>
        <div className='flex items-center justify-between px-4 pb-4'>
          <span className='text-xs uppercase tracking-[0.4em] text-color-muted'>
            Navigate
          </span>
        </div>
        {NAV_LINKS.map((link) => (
          <NavbarMenuItem key={link.href}>
            <Link
              href={link.href}
              size='lg'
              className='w-full rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-foreground/10'
              onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </Link>
          </NavbarMenuItem>
        ))}
        <div className='flex flex-col gap-3 px-4 pt-4'>
          <ThemeToggle variant='menu' onAction={() => setIsMenuOpen(false)} />
          <Button
            as={Link}
            href='/#menu'
            radius='full'
            variant='flat'
            className='border border-(--nav-border) bg-(--surface-highlight) text-sm font-semibold text-foreground shadow-[0_14px_40px_-28px_rgba(12,20,45,0.38) transition duration-200 hover:bg-(--surface-muted)'
            onPress={() => setIsMenuOpen(false)}>
            Browse Menu
          </Button>
          <Button
            as={Link}
            href='/signup'
            radius='full'
            variant='solid'
            className='cta-button text-sm font-semibold'>
            Join Waitlist
          </Button>
        </div>
      </NavbarMenu>
    </Navbar>
  )
}
