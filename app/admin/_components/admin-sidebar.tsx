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
import {cn} from '@/lib/utils'

export function AdminSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
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
                data.navMain[0]?.items?.map((item) => (
                  <SidebarMenuItem
                    className='text-xs tracking-tighter'
                    key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className='group/menu-button h-8 data-[active=true]:hover:bg-background data-[active=true]:bg-gradient-to-b data-[active=true]:from-sidebar-primary data-[active=true]:to-sidebar-primary/70 data-[active=true]:shadow-[0_1px_2px_0_rgb(0_0_0/.05),inset_0_1px_0_0_rgb(255_255_255/.12)] [&>svg]:size-auto'
                      isActive={item.isActive}>
                      <MenuContent {...item} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              <a
                data-active='true'
                className='relative flex flex-row items-center tracking-tight gap-2 rounded-lg p-2 ps-4 text-start [overflow-wrap:anywhere] [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary/10 text-fd-primary'
                href='/docs/components/action-search-bar'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  height={8}
                  width={8}
                  stroke='currentColor'
                  strokeWidth='1'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='lucide lucide-command'
                  aria-hidden='true'>
                  <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3'></path>
                </svg>
                Action Search Bar
              </a>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className='pl-4 text-xs tracking-widest uppercase text-sidebar-foreground/50'>
            {data.navMain[1]?.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain[1]?.items?.map((item) => (
                <SidebarMenuItem
                  className='text-xs tracking-tight font-extrabold'
                  key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size='lg'
                    className='group/menu-button font-medium h-8 [&>svg]:size-auto'
                    isActive={item.isActive}>
                    <MenuContent {...item} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <ThemeToggle />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}

const MenuContent = (item: NavItem) => {
  return (
    <a
      href={item.url}
      suppressHydrationWarning
      className=' font-figtree group/menu-content hover:bg-foreground/10 rounded-lg flex items-center px-4 h-[2.5rem]'>
      <span className='group-hover/menu-content:text-foreground tracking-tighter text-sm font-medium text-foreground/80'>
        {item.title}
      </span>
    </a>
  )
}

const data: Record<string, NavGroup[]> = {
  teams: [
    {
      name: 'BestDeal',
      logo: 'https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/logo-01_upxvqe.png',
      url: '/x',
    },
  ],
  navMain: [
    {
      title: '',
      url: '#',
      items: [
        {
          title: 'Overview',
          url: '/x',
          icon: 'linalool',
          isActive: true,
        },
        {
          title: 'Affiliates',
          url: '/x/affiliates',
          icon: 'chevron-right',
        },
        {
          title: 'Leads',
          url: '/x',
          icon: 'linalool',
          isActive: true,
        },

        {
          title: 'Scans',
          url: '/x',
          icon: 'linalool',
        },

        {
          title: 'Master',
          url: '/x',
          icon: 'linalool',
        },
      ],
    },
    {
      title: 'Preferences',
      url: '/x',
      items: [
        {
          title: 'Settings',
          url: '/x/settings',
          icon: 'linalool',
        },
      ],
    },
  ],
}
