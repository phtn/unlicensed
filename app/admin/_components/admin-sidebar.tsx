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
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import {startTransition, useCallback, useEffect, useMemo} from 'react'
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
        <div className='h-16 flex items-end justify-between'>
          <div className='h-12 flex w-full items-center _justify-center dark:bg-sidebar bg-linear-to-r from-foreground/90 via-foreground/90 to-transparent dark:from-featured/20 dark:via-foreground/10 px-4 rounded-s-3xl'>
            <Icon
              name='rapid-fire'
              className='text-base text-sidebar dark:text-light-table w-32 h-auto font-figtree font-semibold tracking-tight'
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* We only show the first parent group */}
        <SidebarGroup key={'operations'}>
          <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-medium opacity-70'>
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[0] &&
                data.navMain[0]?.items?.map((item) => {
                  const isActive = pathname
                    .split('/')
                    .splice(2)
                    .includes(item.url.split('/').pop()!)
                  return (
                    <SidebarMenuItem
                      className={cn(
                        'text-xs tracking-tighter hover:bg-light-gray/15 dark:hover:bg-blue-100/5 rounded-lg',
                        {
                          'bg-light-gray/20 dark:bg-dark-gray/60': isActive,
                        },
                      )}
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

        {data.navMain.slice(1, 5).map((section, i) => (
          <SidebarGroup key={`${section.title}` + i}>
            <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-medium opacity-70'>
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items?.map((item, x) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem
                      className={cn(
                        'text-sm font-semibold tracking-tight rounded-lg hover:bg-light-gray/20 dark:hover:bg-dark-gray/20',
                        {
                          'dark:bg-dark-gray/60 bg-light-gray/20': isActive,
                        },
                      )}
                      key={item.title + x}>
                      <SidebarMenuButton
                        asChild
                        size='lg'
                        className={cn(
                          'group/menu-button font-medium h-8 [&>svg]:size-auto',
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
            {data.navMain[5]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[5]?.items?.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem
                    className={cn('text-xs tracking-tighter rounded-lg', {
                      'dark:bg-dark-gray/60 bg-light-gray/20': isActive,
                    })}
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

const MenuContent = (item: NavItem) => {
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
      className='font-figtree group/menu-content hover:bg-foreground/10 rounded-lg flex items-center justify-between px-3 h-8 relative w-full'>
      <span className='group-hover/menu-content:text-foreground font-semibold tracking-tight text-sm md:text-base text-foreground/80 capitalize dark:text-white/90'>
        {item.title}
      </span>
      {showBadge && (
        <span className='flex h-5 w-5 aspect-square items-center justify-center rounded-sm bg-foreground/90 px-1.5 text-base font-semibold tabular-nums text-background dark:text-sidebar font-space'>
          {pendingOrdersCount}
        </span>
      )}
    </Link>
  )
}

const data: Record<string, NavGroup[]> = {
  navMain: [
    {
      title: 'Operations',
      url: '/admin/ops',
      items: [
        {
          title: 'Activity',
          url: '/admin/ops',
          icon: 'linalool',
        },

        {
          title: 'Orders',
          url: '/admin/ops/orders',
          icon: 'chevron-right',
        },
        {
          title: 'Deliveries',
          url: '/admin/ops/deliveries',
          icon: 'linalool',
        },

        {
          title: 'Staff',
          url: '/admin/ops/staff',
          icon: 'linalool',
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
          icon: 'linalool',
        },
        {
          title: 'Category',
          url: '/admin/inventory/category',
          icon: 'linalool',
        },
        {
          title: 'Product',
          url: '/admin/inventory/product',
          icon: 'linalool',
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
          icon: 'linalool',
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
          icon: 'linalool',
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
          icon: 'linalool',
        },
        {
          title: 'Analytics',
          url: '/admin/reports/analytics',
          icon: 'linalool',
        },
      ],
    },
    {
      title: 'settings',
      url: '#',
      items: [
        {
          title: 'Payments',
          url: '/admin/payments',
          icon: 'linalool',
        },
        {
          title: 'Admin',
          url: '/admin/settings',
          icon: 'linalool',
        },
        {
          title: 'Store',
          url: '/',
          icon: 'linalool',
        },
      ],
    },
  ],
}
