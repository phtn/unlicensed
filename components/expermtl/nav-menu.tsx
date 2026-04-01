import {api} from '@/convex/_generated/api'
import {adaptCategory} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
import {InnerMenu, type NavMenuSubItem} from '../main/rad-nav-menu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../ui/navigation-menu'

const CATEGORY_ORDER: string[] = [
  'flower',
  'extracts',
  'vapes',
  'pre-rolls',
  'edibles',
]

interface NavMenuProps {
  isMobile?: boolean
  inStoreLobby?: boolean
  scrollY: number
}

const NAV_MENU_VALUE = 'shop'

export const NavMenu = ({isMobile, scrollY, inStoreLobby}: NavMenuProps) => {
  const [openValue, setOpenValue] = useState('')
  const categoriesQuery = useQuery(api.categories.q.listCategories)

  const categories = useMemo(() => {
    const nextCategories = categoriesQuery?.map(adaptCategory)
    const raw = nextCategories?.length ? nextCategories : []
    return [...raw].sort((a, b) => {
      const i = CATEGORY_ORDER.indexOf(a.slug)
      const j = CATEGORY_ORDER.indexOf(b.slug)
      const orderA = i === -1 ? CATEGORY_ORDER.length : i
      const orderB = j === -1 ? CATEGORY_ORDER.length : j
      return orderA - orderB
    })
  }, [categoriesQuery])

  const subItems = useMemo((): Partial<Record<string, NavMenuSubItem[]>> => {
    const acc: Partial<Record<string, NavMenuSubItem[]>> = {}
    for (const c of categories) {
      acc[c.slug] = (c.tiers ?? []).map((t) => ({
        id: `${c.slug}-${(t.slug ?? '').replace(/-/g, '')}`,
        href: `/lobby/category/${c.slug}?tier=${t.slug ?? ''}`,
        label: t.name ?? '',
      }))
    }
    return acc
  }, [categories])

  return (
    <NavigationMenu
      viewport={false}
      className='flex'
      value={openValue}
      onValueChange={setOpenValue}>
      <NavigationMenuList className='gap-0'>
        <NavigationMenuItem value={NAV_MENU_VALUE}>
          <NavigationMenuTrigger
            aria-label='Browse categories'
            className={cn(
              'h-11 w-11 rounded-none p-2 text-sm font-semibold outline-0 focus-visible:bg-brand focus-visible:ring-0',
              // 'text-gray-100 hover:text-white',
              // 'dark:text-white',
              // 'active:bg-transparent dark:data-[state=open]:text-white',
            )}>
            <Icon
              name='details'
              className={cn('size-5 md:size-6 shrink-0 text-white', {
                'text-dark-table dark:text-white': !inStoreLobby,
                'text-dark-table dark:text-white .':
                  !isMobile && scrollY >= 710,
                'text-dark-table dark:text-white _': isMobile && scrollY >= 400,
              })}
              // style={{
              //   color:
              //     !isMobile && scrollY >= 710
              //       ? '#373945'
              //       : scrollY <= 400
              //         ? undefined
              //         : '#373945',
              // }}
            />
            <span className='sr-only'>Browse categories</span>
          </NavigationMenuTrigger>
          <NavigationMenuContent
            dropdown
            className='min-w-[18rem] py-3 px-3 dark:bg-black! bg-white! opacity-100! rounded-none! shadow dark:border-black border-zinc-400'>
            <InnerMenu
              items={categories}
              subItemsBySlug={subItems}
              onClose={() => setOpenValue('')}
            />
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
