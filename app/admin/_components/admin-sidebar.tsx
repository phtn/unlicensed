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
import type {NavGroup, NavItem} from './ui/types'

// Global Set to track prefetched routes across all instances
const prefetchedRoutes = new Set<string>()

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
    <Sidebar {...props} className='border-none!' suppressHydrationWarning>
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
                  const isActive = pathname
                    .split('/')
                    .splice(2)
                    .filter((r) => r !== 'ops')
                    .includes(item.url.split('/').pop()!)
                  return (
                    <SidebarMenuItem
                      className={cn('text-sm tracking-tight rounded-xl', {
                        'bg-dark-gray text-white dark:bg-blue-100/15 md:hover:bg-dark-gray/90 md:dark:hover:bg-blue-100/20':
                          isActive,
                      })}
                      key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className='capitalize group/menu-button data-[active=true]:hover:bg-background data-[active=true]:bg-linear-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/50 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto'
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
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem
                      className={cn(
                        'text-sm font-semibold tracking-tight rounded-xl',
                        {
                          'bg-dark-gray text-white dark:bg-blue-100/15 md:hover:bg-dark-gray/90 md:dark:hover:bg-blue-100/20':
                            isActive,
                        },
                      )}
                      key={item.title + x}>
                      <SidebarMenuButton
                        asChild
                        size='lg'
                        className={cn(
                          'group/menu-button font-medium h-7 [&>svg]:size-auto',
                        )}
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
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem
                    className={cn(
                      'text-sm font-semibold tracking-tight rounded-xl',
                      {
                        'bg-dark-gray text-white dark:bg-blue-100/15 md:hover:bg-dark-gray/90 md:dark:hover:bg-blue-100/20':
                          isActive,
                      },
                    )}
                    key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size='lg'
                      className='group/menu-button h-8 [&>svg]:size-auto'
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

const MenuContent = memo(function MenuContent(item: NavItem) {
  const adminStats = useQuery(api.orders.q.getAdminStats)
  const pendingOrdersCount = adminStats?.pendingOrdersCount ?? 0
  const showBadge = item.url === '/admin/orders' && pendingOrdersCount > 0
  const router = useRouter()

  // Prefetch on hover as a fallback (in case it wasn't prefetched yet)
  const handleMouseEnter = useCallback(() => {
    if (!prefetchedRoutes.has(item.url)) {
      router.prefetch(item.url)
      prefetchedRoutes.add(item.url)
    }
  }, [item.url, router])

  // Handle navigation with transition
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      startTransition(() => {
        router.push(item.url)
      })
    },
    [item.url, router],
  )

  return (
    <Link
      href={item.url}
      prefetch={true}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className='group/menu-content hover:bg-foreground/5 rounded-xl flex items-center px-3 h-8 relative w-full'>
      <Icon name={item.icon as IconName} className='mr-2.5 size-4' />
      <span className='font-okxs font-normal tracking-normal text-sm md:text-sm capitalize dark:text-white/90'>
        {item.title}
      </span>
      {showBadge && (
        <span className='flex h-5 w-5 aspect-square items-center justify-center rounded-sm bg-foreground/90 px-1.5 text-base font-semibold tabular-nums text-background dark:text-sidebar font-space'>
          {pendingOrdersCount}
        </span>
      )}
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
          title: 'Overview',
          url: '/admin/inventory',
          icon: 'document',
        },
        {
          title: 'Category',
          url: '/admin/inventory/category',
          icon: 'book',
        },
        {
          title: 'Product',
          url: '/admin/inventory/product',
          icon: 'candy',
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
          icon: 'tag-light',
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
