'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/app/admin/_components/ui/sidebar'
import {ThemeToggle} from '@/components/ui/theme-toggle'
import {api} from '@/convex/_generated/api'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {memo, startTransition, useCallback, useEffect, useMemo} from 'react'
import {useSidebar} from './ui/sidebar'
import type {NavGroup, NavItem} from './ui/types'

// Global Set to track prefetched routes across all instances
const prefetchedRoutes = new Set<string>()

const isRouteActive = (url: string, pathname: string) =>
  pathname === url || (url !== '/admin/ops' && pathname.startsWith(url + '/'))

export function AdminSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  // Collect all routes from navMain data
  const allRoutes = useMemo(() => {
    const routes: string[] = []
    data.navMain.forEach((group) => {
      group.items?.forEach((item) => {
        if (item.url && item.url !== '#' && item.url !== '/x') {
          routes.push(item.url)
        }
      })
    })
    return routes
  }, [])

  // Prefetch all routes when sidebar mounts
  useEffect(() => {
    const prefetchAllRoutes = () => {
      allRoutes.forEach((route) => {
        if (!prefetchedRoutes.has(route)) {
          router.prefetch(route)
          prefetchedRoutes.add(route)
        }
      })
    }

    // Prefetch immediately
    prefetchAllRoutes()

    // Also prefetch after a short delay to avoid blocking initial render
    const timeoutId = setTimeout(prefetchAllRoutes, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [allRoutes, router])

  return (
    <Sidebar
      {...props}
      className='border-none! z-9999'
      suppressHydrationWarning>
      <SidebarHeader className=''>
        <Logo />
      </SidebarHeader>
      <SidebarContent className='hide-scrollbar'>
        {/* We only show the first parent group */}
        <SidebarGroup key={'operations'}>
          <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-brk'>
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[0] &&
                data.navMain[0]?.items?.map((item) => {
                  const isActive = isRouteActive(item.url, pathname)
                  return (
                    <SidebarMenuItem
                      key={item.title}
                      className={cn(
                        'text-sm font-semibold tracking-tight w-full rounded-lg',
                        {
                          'bg-dark-gray text-white dark:bg-blue-100/15 md:hover:bg-dark-gray/90 md:dark:hover:bg-blue-100/20 rounded-lg':
                            isActive,
                        },
                      )}>
                      <SidebarMenuButton
                        asChild
                        size='default'
                        isActive={isActive}>
                        <MenuContent {...item} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {data.navMain.slice(1, 6).map((section, i) => (
          <SidebarGroup key={`${section.title}` + i} className='hide-scrollbar'>
            <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-brk'>
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className='scrollbar-hide'>
              <SidebarMenu>
                {section.items?.map((item, x) => {
                  const isActive = isRouteActive(item.url, pathname)
                  return (
                    <SidebarMenuItem
                      className={cn(
                        'text-sm font-semibold tracking-tight w-full rounded-lg',
                        {
                          'bg-dark-gray text-white dark:bg-blue-100/15 md:hover:bg-dark-gray/90 md:dark:hover:bg-blue-100/20':
                            isActive,
                        },
                      )}
                      key={item.title + x}>
                      <SidebarMenuButton
                        asChild
                        size='default'
                        isActive={isActive}>
                        <MenuContent {...item} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* Secondary Navigation */}
        <SidebarGroup key='settings'>
          <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-medium opacity-70'>
            {data.navMain[6]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[6]?.items?.map((item) => {
                const isActive = isRouteActive(item.url, pathname)
                return (
                  <SidebarMenuItem
                    className={cn(
                      'text-sm font-semibold tracking-tight rounded-lg',
                      {
                        'bg-dark-gray text-white dark:bg-blue-100/15 md:hover:bg-dark-gray/90 md:dark:hover:bg-blue-100/20':
                          isActive,
                      },
                    )}
                    key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size='default'
                      isActive={isActive}>
                      <MenuContent {...item} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <ThemeToggle variant='menu' />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}

const Logo = () => {
  return (
    <div className='h-10 md:h-16 translate-x-1.5 flex items-end justify-between'>
      <div className='h-12 flex w-full items-center ps-2 rounded-s-full'>
        <Icon
          name='rapid-fire-latest'
          className='text-base text-dark-gray dark:text-light-table w-32 h-auto font-figtree font-semibold tracking-tight'
        />
      </div>
    </div>
  )
}

const PendingOrdersBadge = memo(function PendingOrdersBadge() {
  const count = useQuery(api.orders.q.getPendingOrdersCount) ?? 0
  if (count === 0) return null
  return (
    <span className='flex h-5 w-7 items-center justify-center rounded-sm text-base font-semibold tabular-nums font-space text-light-gray dark:text-amber-200/80'>
      {count}
    </span>
  )
})

const MenuContent = memo(function MenuContent(item: NavItem) {
  const router = useRouter()
  const {isMobile, setOpenMobile} = useSidebar()

  const handleMouseEnter = useCallback(() => {
    if (!prefetchedRoutes.has(item.url)) {
      router.prefetch(item.url)
      prefetchedRoutes.add(item.url)
    }
  }, [item.url, router])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (isMobile) {
        setOpenMobile(false)
      }
      startTransition(() => {
        router.push(item.url)
      })
    },
    [item.url, router, isMobile, setOpenMobile],
  )

  return (
    <Link
      href={item.url}
      prefetch={true}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className='group/menu-content hover:bg-foreground/5 flex items-center px-3 h-8 relative w-full rounded-lg'>
      <Icon name={item.icon as IconName} className='mr-2.5 size-4.5' />
      <span className='font-okxs font-normal tracking-normal text-sm md:text-sm capitalize dark:text-white/90 w-full'>
        {item.title}
      </span>
      <div className='flex items-center justify-end w-full'>
        {item.url === '/admin/ops/orders' && <PendingOrdersBadge />}
      </div>
    </Link>
  )
})

const data: Record<string, NavGroup[]> = {
  navMain: [
    {
      title: 'Operations',
      url: '/admin/ops',
      items: [
        {
          title: 'Activity',
          url: '/admin/ops',
          icon: 'arrow-trending',
        },

        {
          title: 'Orders',
          url: '/admin/ops/orders',
          icon: 'badge',
        },
        {
          title: 'Deliveries',
          url: '/admin/ops/deliveries',
          icon: 'package',
        },
        {
          title: 'Customers',
          url: '/admin/ops/customers',
          icon: 'user-fill',
        },
        {
          title: 'Staff',
          url: '/admin/ops/staff',
          icon: 'user',
        },
      ],
    },
    {
      title: 'Inventory',
      url: '/admin/inventory',
      items: [
        {
          title: 'Category',
          url: '/admin/inventory/category',
          icon: 'book',
        },
        {
          title: 'Product',
          url: '/admin/inventory/product',
          icon: 't',
        },
        {
          title: 'Archives',
          url: '/admin/inventory/archives',
          icon: 'archive',
        },
        {
          title: 'Tools',
          url: '/admin/inventory/tools',
          icon: 'gallery-edit-bold',
        },
      ],
    },
    {
      title: 'suppliers',
      url: '/admin/suppliers',
      items: [
        {
          title: 'Couriers',
          url: '/admin/suppliers/couriers',
          icon: 'airplane-takeoff',
        },
      ],
    },
    {
      title: 'Content',
      url: '/admin/cms',
      items: [
        {
          title: 'Blogposts',
          url: '/admin/cms/blog',
          icon: 'draw-text',
        },
      ],
    },
    {
      title: 'reports',
      url: '/admin/reports',
      items: [
        {
          title: 'Sales',
          url: '/admin/reports/sales',
          icon: 'hand-card-fill',
        },
        {
          title: 'Analytics',
          url: '/admin/reports/analytics',
          icon: 'chart-sparkle',
        },
      ],
    },
    {
      title: 'messaging',
      url: '/admin/messaging',
      items: [
        {
          title: 'Email',
          url: '/admin/messaging/email',
          icon: 'email',
        },
        {
          title: 'chat',
          url: '/admin/messaging/chat',
          icon: 'chat',
        },
        {
          title: 'alerts',
          url: '/admin/messaging/alerts',
          icon: 'bell',
        },
      ],
    },
    {
      title: '',
      url: '#',
      items: [
        {
          title: 'Settings',
          url: '/admin/settings',
          icon: 'settings',
        },
        {
          title: 'Payments',
          url: '/admin/payments',
          icon: 'file-sync',
        },
        {
          title: 'Store',
          url: '/',
          icon: 'window',
        },
      ],
    },
  ],
}
