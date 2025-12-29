// 'use client'

import {NavGroup} from '../../_components/ui/types'

// import {Icon, IconName} from '@/lib/icons'
// import {cn} from '@/lib/utils'
// import Link from 'next/link'
// import {usePathname, useRouter} from 'next/navigation'
// import {
//   ComponentProps,
//   MouseEvent,
//   startTransition,
//   useCallback,
//   useEffect,
//   useMemo,
// } from 'react'
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from './sidebar'

// export interface NavGroup {
//   name?: string
//   title?: string
//   url?: string
//   logo?: string
//   items?: NavItem[]
// }

// export interface NavItem {
//   title: string
//   url: string
//   icon?: IconName
//   isActive?: boolean
// }

// interface ConfigSidebarProps {
//   navData: Record<string, NavGroup[]>
//   sidebarProps?: ComponentProps<typeof Sidebar>
// }

// // Global Set to track prefetched routes across all instances
// const prefetchedRoutes = new Set<string>()

// export const ConfigSidebar = ({sidebarProps, navData}: ConfigSidebarProps) => {
//   const pathname = usePathname()
//   const router = useRouter()

//   // Prefetch all routes when sidebar mounts
//   useEffect(() => {
//     // Collect all routes from navMain data
//       const allRoutes = () => {
//         const routes: string[] = []
//         navData.navMain.forEach((group) => {
//           group.items?.forEach((item) => {
//             if (item.url && item.url !== '#' && item.url !== '/x') {
//               routes.push(item.url)
//             }
//           })
//         })
//         return routes
//       }
//     const prefetchAllRoutes = () => {
//       allRoutes.forEach((route) => {
//         if (!prefetchedRoutes.has(route)) {
//           router.prefetch(route)
//           prefetchedRoutes.add(route)
//         }
//       })
//     }

//     // Prefetch immediately
//     prefetchAllRoutes()

//     // Also prefetch after a short delay to avoid blocking initial render
//     const timeoutId = setTimeout(prefetchAllRoutes, 100)

//     return () => {
//       clearTimeout(timeoutId)
//     }
//   }, [router])

//   return (
//     <Sidebar
//       {...sidebarProps}
//       className='border-none!'
//       suppressHydrationWarning>
//       <SidebarHeader className=''>
//         <div className='h-14 flex items-end justify-between'>
//           <div className='h-11 flex w-full items-center dark:bg-sidebar bg-linear-to-r from-foreground/15 via-foreground/10 to-transparent dark:from-featured/20 dark:via-foreground/10 px-4 rounded-s-md'>
//             <Icon
//               name='protap'
//               className='text-base text-brand w-28 h-auto font-figtree font-semibold tracking-tight'
//             />
//           </div>
//         </div>
//       </SidebarHeader>
//       <SidebarContent>
//         {navData.navMain
//           .slice(0, navData.navMain.length - 1)
//           .map((section, i) => (
//             <SidebarGroup key={`${section.title}` + i}>
//               <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-medium font-figtree opacity-70'>
//                 {section.title}
//               </SidebarGroupLabel>
//               <SidebarGroupContent>
//                 <SidebarMenu>
//                   {section.items?.map((item, x) => {
//                     const isActive = pathname === item.url
//                     return (
//                       <SidebarMenuItem
//                         className={cn(
//                           'text-sm font-semibold tracking-tight rounded-lg hover:bg-light-gray/20 dark:hover:bg-dark-gray/20',
//                           {
//                             'dark:bg-dark-gray/60 bg-light-gray/20': isActive,
//                           },
//                         )}
//                         key={item.title + x}>
//                         <SidebarMenuButton
//                           asChild
//                           size='lg'
//                           className={cn(
//                             'group/menu-button font-medium h-8 [&>svg]:size-auto',
//                           )}
//                           isActive={isActive}>
//                           <MenuContent {...item} />
//                         </SidebarMenuButton>
//                       </SidebarMenuItem>
//                     )
//                   })}
//                 </SidebarMenu>
//               </SidebarGroupContent>
//             </SidebarGroup>
//           ))}
//       </SidebarContent>
//       <SidebarFooter>
//         {/* Secondary Navigation */}
//         <SidebarGroup key='settings'>
//           <SidebarGroupLabel className='pl-3 text-[8px] tracking-widest uppercase font-medium font-figtree opacity-70'>
//             {navData.navMain[navData.navMain.length - 1]?.title}
//           </SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {navData.navMain[navData.navMain.length - 1]?.items?.map(
//                 (item) => {
//                   const isActive = pathname === item.url
//                   return (
//                     <SidebarMenuItem
//                       className={cn('text-xs tracking-tighter rounded-lg', {
//                         'dark:bg-dark-gray/60 bg-light-gray/20': isActive,
//                       })}
//                       key={item.title}>
//                       <SidebarMenuButton
//                         asChild
//                         size='lg'
//                         className='group/menu-button h-8 [&>svg]:size-auto'
//                         isActive={isActive}>
//                         <MenuContent {...item} />
//                       </SidebarMenuButton>
//                     </SidebarMenuItem>
//                   )
//                 },
//               )}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarFooter>
//     </Sidebar>
//   )
// }

// const MenuContent = (item: NavItem) => {
//   const router = useRouter()

//   // Prefetch on hover as a fallback (in case it wasn't prefetched yet)
//   const handleMouseEnter = useCallback(() => {
//     if (!prefetchedRoutes.has(item.url)) {
//       router.prefetch(item.url)
//       prefetchedRoutes.add(item.url)
//     }
//   }, [item.url, router])

//   // Handle navigation with transition
//   const handleClick = useCallback(
//     (e: MouseEvent<HTMLAnchorElement>) => {
//       e.preventDefault()
//       startTransition(() => {
//         router.push(item.url)
//       })
//     },
//     [item.url, router],
//   )

//   return (
//     <Link
//       href={item.url}
//       prefetch={true}
//       onMouseEnter={handleMouseEnter}
//       onClick={handleClick}
//       className='font-figtree group/menu-content hover:bg-foreground/10 rounded-lg flex items-center justify-between px-3 h-8 relative w-full'>
//       <span className='group-hover/menu-content:text-foreground font-semibold tracking-tight text-sm md:text-base text-foreground/80 capitalize dark:text-white/90'>
//         {item.title}
//       </span>
//     </Link>
//   )
// }

export const data: Record<string, NavGroup[]> = {
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
          title: 'Activity',
          url: '/admin',
          icon: 're-up.ph',
        },

        {
          title: 'Orders',
          url: '/admin/orders',
          icon: 'chevron-right',
        },
        {
          title: 'Deliveries',
          url: '/admin/deliveries',
          icon: 're-up.ph',
        },

        {
          title: 'Staff',
          url: '/admin/staff',
          icon: 're-up.ph',
        },
      ],
    },
    {
      title: 'Inventory',
      items: [
        {
          title: 'Overview',
          url: '/admin/inventory',
          icon: 're-up.ph',
        },
        {
          title: 'Category',
          url: '/admin/category',
          icon: 're-up.ph',
        },
        {
          title: 'Product',
          url: '/admin/product',
          icon: 're-up.ph',
        },
        {
          title: 'Blog',
          url: '/admin/blog',
          icon: 're-up.ph',
        },
      ],
    },
    {
      title: 'reports',
      url: '#',
      items: [
        {
          title: 'Sales',
          url: '/admin/sales',
          icon: 're-up.ph',
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
          icon: 're-up.ph',
        },
        {
          title: 'Store',
          url: '/',
          icon: 're-up.ph',
        },
      ],
    },
  ],
}
