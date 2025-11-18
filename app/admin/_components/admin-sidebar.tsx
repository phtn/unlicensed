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
import type {NavGroup, NavItem} from './ui/types'
// import {useAppTheme} from '@/hooks/use-theme'
import {ThemeToggle} from '@/components/ui/theme-toggle'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

export function AdminSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props} className='border-none!' suppressHydrationWarning>
      <SidebarHeader className=''>
        <div className='h-14.5 flex items-end justify-between px-4'>
          <h3 className='text-base h-8 font-figtree font-semibold tracking-tight'>
            Unlicensed
          </h3>
        </div>
        <div
          className={cn(
            'relative transition-all duration-300 ease-in-out',
            'after:absolute after:inset-x-0 after:top-0 after:h-[0.5px] after:bg-linear-to-r after:from-foreground/10 after:via-foreground/15 before:to-foreground/10',
          )}
        />
      </SidebarHeader>
      <SidebarContent>
        {/* We only show the first parent group */}
        <SidebarGroup>
          <SidebarGroupLabel className='pl-3 h-10'>
            <h3 className='text-lg tracking-tight font-medium text-gray-900 dark:text-gray-100'>
              {data.navMain[0]?.title}
            </h3>
          </SidebarGroupLabel>
          <SidebarGroupContent className='py-2'>
            <SidebarMenu>
              {data.navMain[0] &&
                data.navMain[0]?.items?.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem
                      className='text-xs tracking-tighter'
                      key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className='group/menu-button h-8 data-[active=true]:hover:bg-background data-[active=true]:bg-linear-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto'
                        isActive={isActive}>
                        <MenuContent {...item} />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className='pl-4 text-xs tracking-widest uppercase text-sidebar-foreground/50'>
            {data.navMain[1]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[1]?.items?.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem
                    className='text-xs tracking-tight font-extrabold'
                    key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size='lg'
                      className='group/menu-button font-medium h-8 [&>svg]:size-auto'
                      isActive={isActive}>
                      <MenuContent {...item} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className='pl-4 text-xs tracking-widest uppercase text-sidebar-foreground/50'>
            {data.navMain[2]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[2]?.items?.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem
                    className='text-xs tracking-tight font-extrabold'
                    key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size='lg'
                      className='group/menu-button font-medium h-8 [&>svg]:size-auto'
                      isActive={isActive}>
                      <MenuContent {...item} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <ThemeToggle />
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

  return (
    <Link
      href={item.url}
      prefetch={true}
      suppressHydrationWarning
      className=' font-figtree group/menu-content hover:bg-foreground/10 rounded-lg flex items-center justify-between px-4 h-10 relative'>
      <span className='group-hover/menu-content:text-foreground tracking-tighter text-sm font-medium text-foreground/80'>
        {item.title}
      </span>
      {showBadge && (
        <span className='flex h-5 min-w-5 items-center justify-center rounded-md bg-orange-500 px-1.5 text-xs font-medium tabular-nums text-white'>
          {pendingOrdersCount}
        </span>
      )}
    </Link>
  )
}

const data: Record<string, NavGroup[]> = {
  teams: [
    {
      name: '',
      logo: '',
      url: '/admin',
    },
  ],
  navMain: [
    {
      title: '',
      url: '#',
      items: [
        {
          title: 'Overview',
          url: '/admin',
          icon: 'linalool',
        },
        {
          title: 'Sales',
          url: '/admin/sales',
          icon: 'linalool',
        },
        {
          title: 'Orders',
          url: '/admin/orders',
          icon: 'chevron-right',
        },
        {
          title: 'Deliveries',
          url: '/admin/deliveries',
          icon: 'linalool',
        },
        {
          title: 'Inventory',
          url: '/admin/inventory',
          icon: 'linalool',
        },
        {
          title: 'Personnel',
          url: '/admin/personnel',
          icon: 'linalool',
        },
        {
          title: '',
          url: '/x',
          icon: 'linalool',
        },
      ],
    },
    {
      title: 'Create',
      items: [
        {
          title: 'Category',
          url: '/admin/category/create',
          icon: 'linalool',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      items: [
        {
          title: 'Settings',
          url: '/admin/settings',
          icon: 'linalool',
        },
      ],
    },
  ],
}
