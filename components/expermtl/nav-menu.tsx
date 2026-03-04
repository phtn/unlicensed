import {api} from '@/convex/_generated/api'
import {adaptCategory} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
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
// 2. Tier:
// Flower: B, A, AA, AAA, AAAA, RARE
// Extract: Cured Resin, Fresh Frozen, Solventless
// Vape: Distillate, Cured Resin, Fresh Frozen, Solventless
// Pre Roll: Flower, Infused

// 3. Subcategory:
// Vape: Cartridge, Disposable, Pod
// Extract: Badder, Sugar, Shatter, Diamonds, Sauce, Crumble, Wax, Ice Water Hash, Static Hash, Rosin
// Pre Roll: Single Pack, Multi Pack
// Flower: Regular, Smalls
/** Mock submenu links per category for experimental nav. */
const MOCK_SUB_ITEMS_BY_SLUG: Partial<Record<string, NavMenuSubItem[]>> = {
  flower: [
    {id: 'b', label: 'B', href: '/lobby/category/flower?tier=B'},
    {id: 'a', label: 'A', href: '/lobby/category/flower?tier=A'},
    {id: 'aa', label: 'AA', href: '/lobby/category/flower?tier=AA'},
    {id: 'aaa', label: 'AAA', href: '/lobby/category/flower?tier=AAA'},
    {id: 'aaaa', label: 'AAAA', href: '/lobby/category/flower?tier=AAAA'},
    {id: 'rare', label: 'RARE', href: '/lobby/category/flower?tier=RARE'},
  ],
  extracts: [
    {
      id: 'cured_resin',
      label: 'Cured Resin',
      href: '/lobby/category/extracts?tier=cured_resin',
    },
    {
      id: 'fresh_frozen',
      label: 'Fresh Frozen',
      href: '/lobby/category/extracts?tier=fresh_frozen',
    },
    {
      id: 'solventless',
      label: 'Solventless',
      href: '/lobby/category/extracts?tier=solventless',
    },
  ],
  vapes: [
    {
      id: 'distillate',
      label: 'Distillate',
      href: '/lobby/category/vapes?tier=distillate',
    },
    {
      id: 'cured_resin',
      label: 'Cured Resin',
      href: '/lobby/category/vapes?tier=cured_resin',
    },
    {
      id: 'fresh_frozen',
      label: 'Fresh Frozen',
      href: '/lobby/category/vapes?tier=fresh_frozen',
    },
    {
      id: 'solventless',
      label: 'Solventless',
      href: '/lobby/category/vapes?tier=solventless',
    },
  ],
  'pre-rolls': [
    {
      id: 'flower',
      label: 'Flower',
      href: '/lobby/category/pre-rolls?tier=flower',
    },
    {
      id: 'infused',
      label: 'Infused',
      href: '/lobby/category/pre-rolls?tier=infused',
    },
  ],
}

interface NavMenuProps {
  isMobile?: boolean
  inStoreLobby?: boolean
}

export const NavMenu = ({isMobile, inStoreLobby}: NavMenuProps) => {
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

  return (
    <NavigationMenu viewport={false} className='flex'>
      <NavigationMenuList className='gap-0'>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              'rounded-none bg-transparent px-3 py-2 text-sm font-semibold',
              'text-gray-100 hover:text-white',
              'dark:text-white',
              ' dark:data-[state=open]:text-white',
              {
                'text-dark-table hover:bg-dark-table bg-sidebar py-1 size-6.5':
                  isMobile,
              },
            )}>
            <Icon name='details' className='size-5 md:size-6 shrink-0' />
          </NavigationMenuTrigger>
          <NavigationMenuContent
            dropdown
            className='min-w-[18rem] py-3 px-3 dark:bg-black! bg-white! opacity-100! rounded-none!'>
            <InnerMenu
              items={categories}
              subItemsBySlug={MOCK_SUB_ITEMS_BY_SLUG}
            />
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
