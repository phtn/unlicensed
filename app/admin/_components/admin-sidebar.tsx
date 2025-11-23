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
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

export function AdminSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props} className='border-none!' suppressHydrationWarning>
      <SidebarHeader className=''>
        <div className='h-18 flex items-center justify-between'>
          <div className='h-12 flex w-full items-center _justify-center dark:bg-sidebar bg-linear-to-r from-foreground/90 via-foreground/90 to-transparent dark:from-brand dark:via-foreground px-4 rounded-lg'>
            <Icon
              name='rapid-fire'
              className='text-base text-brand dark:text-sidebar w-40 h-auto font-figtree font-semibold tracking-tight'
            />
          </div>
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
          <SidebarGroupLabel className='pl-4 text-xs tracking-widest uppercase text-sidebar-foreground/50'>
            {data.navMain[0]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent className='py-2'>
            <SidebarMenu>
              {data.navMain[0] &&
                data.navMain[0]?.items?.map((item) => {
                  const isActive = pathname
                    .split('/')
                    .splice(2)
                    .includes(item.url.split('/').pop()!)
                  return (
                    <SidebarMenuItem
                      className={cn('text-xs tracking-tighter', {
                        'bg-sidebar-accent rounded-lg': isActive,
                      })}
                      key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className='capitalize group/menu-button h-8 data-[active=true]:hover:bg-background data-[active=true]:bg-linear-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto'
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
                    className={cn('text-xs tracking-tighter', {
                      'bg-sidebar-accent rounded-lg': isActive,
                    })}
                    key={item.title}>
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
                    className={cn('text-xs tracking-tighter', {
                      'bg-sidebar-accent rounded-lg': isActive,
                    })}
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

  return (
    <Link
      href={item.url}
      prefetch={true}
      suppressHydrationWarning
      className=' font-figtree group/menu-content hover:bg-foreground/10 rounded-lg flex items-center justify-between px-4 h-10 relative'>
      <span className='group-hover/menu-content:text-foreground tracking-tighter text-sm font-medium text-foreground/80 capitalize'>
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
  teams: [
    {
      name: '',
      logo: '',
      url: '/admin',
    },
  ],
  navMain: [
    {
      title: 'Operations',
      url: '#',
      items: [
        {
          title: 'stats',
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
          url: '/admin/category',
          icon: 'linalool',
        },
        {
          title: 'Product',
          url: '/admin/product',
          icon: 'linalool',
        },
      ],
    },
    {
      title: 'settings',
      url: '#',
      items: [
        {
          title: 'Advanced',
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
