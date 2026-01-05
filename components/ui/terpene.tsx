import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Chip} from '@heroui/react'
import {useId} from 'react'

interface TerpeneChipProps {
  id: string
  name: IconName
  label?: string
  ghost?: boolean
}

export const TerpeneChip = ({
  id,
  name,
  label,
  ghost = false,
}: TerpeneChipProps) => {
  return (
    <Chip
      id={id}
      radius='md'
      startContent={
        <Icon name={name} className='text-slate-100 size-8 aspect-square' />
      }
      classNames={{
        base: `flex justify-between px-0 h-10 bg-background/80 shadow-pink-100/30 ${ghost ? 'bg-transparent' : ' border-small border-white'}`,
        content: 'drop-shadow-xs shadow-black text-foreground capitalize',
      }}>
      {label}
    </Chip>
  )
}

export const TerpeneGray = ({id, name, ghost = false}: TerpeneChipProps) => {
  return (
    <Chip
      id={id}
      radius='md'
      startContent={
        <Icon
          name={name}
          className='text-[#FF9F1C] dark:text-[#FF9F1C] size-7 aspect-square'
        />
      }
      classNames={{
        base: `flex justify-between px-0 h-7 grow-0 bg-linear-to-r from-transparent via-transparent to-slate-600/2 overflow-hidden ${ghost ? 'bg-transparent' : 'border-r-[0.33px] border-foreground/10'}`,
        content: 'font-light text-foreground capitalize text-sm',
      }}
      variant='flat'>
      {name}
    </Chip>
  )
}

interface IProfilePill {
  group: 'effects' | 'flavors' | 'terpenes'
  name: string
  label?: string
}

export const ProfilePill = ({group, name}: IProfilePill) => {
  const id = useId()
  return (
    <div
      id={id}
      className={`flex items-center justify-between pl-0 pr-2 gap-1 rounded-full h-7 grow-0  bg-background/80 overflow-hidden`}>
      <Icon
        name={group[0] as IconName}
        className={cn('shrink-0 size-5 aspect-square', {
          'text-effects': group === 'effects',
          'text-flavors': group === 'flavors',
          'text-terpenes': group === 'terpenes',
        })}
      />
      <span className='text-sm font-light'>{name}</span>
    </div>
  )
}

interface StatChipProps {
  label?: string
  name?: IconName
  value?: string | number | boolean
  ghost?: boolean
}

export const StatChip = ({
  label,
  name,
  value,
  ghost = false,
}: StatChipProps) => {
  return (
    <Chip
      radius='md'
      startContent={
        name ? (
          <Icon
            name={name}
            className={cn('size-6! protrait:pt-1', {
              'text-red-500 dark:text-red-400': value === 'high',
              'text-blue-500 dark:text-blue-400': value === 'medium',
            })}
          />
        ) : (
          <span className='text-xs text-slate-600 dark:text-limited font-bold'>
            {label}
          </span>
        )
      }
      className=' border-[0.33px] border-foreground/15'
      classNames={{
        base: `ps-2 h-7 grow-0 bg-linear-to-r from-transparent via-transparent to-slate-300/5 overflow-hidden ${ghost ? 'bg-transparent' : 'border-r-[0.33px] border-foreground/10'}`,
        content:
          'flex items-center justify-center text-foreground uppercase font-semibold text-xs',
      }}
      variant='flat'>
      <span className={cn(`font-space ${name && 'ml-0 opacity-100'}`)}>
        {value}
      </span>
    </Chip>
  )
}

export const TERPENE_ICON_MAP = {
  myrcene: 12, // earthy / herbal leaf
  limonene: 13, // citrus slice
  caryophyllene: 6, // spicy / pepper
  alpha_pinene: 18, // pine tree
  beta_pinene: 29, // pine cone
  linalool: 21, // lavender
  humulene: 20, // hops
  terpinolene: 28, // fresh green leaf
  ocimene: 25, // sweet floral
  bisabolol: 5, // chamomile-like flower
  nerolidol: 24, // tea cup
  farnesene: 23, // fruity / green apple
} as const

export const FLAVOR_ICON_MAP = {
  berry: 1,
  floral: 2,
  tropical: 3,
  sweet_floral: 4,
  chamomile: 5,
  spicy: 6,
  creamy: 7,
  mint: 8,
  herbal_fresh: 9,
  green_leaf: 10,

  floral_petals: 11,
  herbal: 12,
  citrus: 13,
  candy_sweet: 14,
  balanced_leaf: 15,
  woody: 16,
  pinecone_woody: 17,
  pine: 18,
  fresh_herb: 19,
  hops: 20,

  lavender: 21,
  rose: 22,
  stone_fruit: 23,
  tea: 24,
  sweet_flower: 25,
  fresh_leaf: 26,
  floral_cluster: 27,
  green_leaf_fresh: 28,
  pinecone: 29,
  evergreen: 30,
} as const

// Combined dataset, flattened arrays, and TypeScript types for terpenes & flavors.
// Icons are referenced by index (1..30) from your sprite/image.

/* ---------------------------
   Types
   --------------------------- */

export type TerpeneName = keyof typeof TERPENE_ICON_MAP
export type FlavorName = keyof typeof FLAVOR_ICON_MAP
export type ItemCategory = 'terpene' | 'flavor'

export type Item = {
  /** machine key */
  id: string
  /** human-friendly display name */
  name: string
  /** 'terpene' | 'flavor' */
  category: ItemCategory
  /** icon index in your sprite (1..30) */
  iconIndex: number
  /** short description / aroma family */
  description?: string
}

/* ---------------------------
   Flattened arrays (names)
   --------------------------- */

export const TERPENES = Object.keys(TERPENE_ICON_MAP) as TerpeneName[]
export const FLAVORS = Object.keys(FLAVOR_ICON_MAP) as FlavorName[]

/* ---------------------------
   Combined dataset (array)
   --------------------------- */

export const ITEMS: Item[] = [
  // TERPENES (12)
  {
    id: 'myrcene',
    name: 'Myrcene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.myrcene,
    description: 'Earthy, herbal — common in many strains.',
  },
  {
    id: 'limonene',
    name: 'Limonene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.limonene,
    description: 'Citrus, zesty — orange/lemon-like.',
  },
  {
    id: 'caryophyllene',
    name: 'Caryophyllene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.caryophyllene,
    description: 'Spicy, peppery, woody.',
  },
  {
    id: 'alpha_pinene',
    name: 'α-Pinene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.alpha_pinene,
    description: 'Piney, forest-like.',
  },
  {
    id: 'beta_pinene',
    name: 'β-Pinene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.beta_pinene,
    description: 'Pine / woody notes.',
  },
  {
    id: 'linalool',
    name: 'Linalool',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.linalool,
    description: 'Floral, lavender-like.',
  },
  {
    id: 'humulene',
    name: 'Humulene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.humulene,
    description: 'Woody, earthy — also in hops.',
  },
  {
    id: 'terpinolene',
    name: 'Terpinolene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.terpinolene,
    description: 'Fresh, floral-green, slightly piney.',
  },
  {
    id: 'ocimene',
    name: 'Ocimene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.ocimene,
    description: 'Sweet, herbal, light floral.',
  },
  {
    id: 'bisabolol',
    name: 'Bisabolol',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.bisabolol,
    description: 'Soft floral — chamomile-like.',
  },
  {
    id: 'nerolidol',
    name: 'Nerolidol',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.nerolidol,
    description: 'Woody-floral, tea-like.',
  },
  {
    id: 'farnesene',
    name: 'Farnesene',
    category: 'terpene',
    iconIndex: TERPENE_ICON_MAP.farnesene,
    description: 'Fruity / green-apple notes.',
  },

  // FLAVORS (30)
  {
    id: 'berry',
    name: 'Berry',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.berry,
    description: 'Berry, jammy fruit.',
  },
  {
    id: 'floral',
    name: 'Floral',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.floral,
    description: 'General floral aroma.',
  },
  {
    id: 'tropical',
    name: 'Tropical',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.tropical,
    description: 'Tropical fruits, mango/papaya.',
  },
  {
    id: 'sweet_floral',
    name: 'Sweet Floral',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.sweet_floral,
    description: 'Sweet flower notes.',
  },
  {
    id: 'chamomile',
    name: 'Chamomile',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.chamomile,
    description: 'Soft, tea-like chamomile.',
  },
  {
    id: 'spicy',
    name: 'Spicy',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.spicy,
    description: 'Peppery, baking-spice.',
  },
  {
    id: 'creamy',
    name: 'Creamy',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.creamy,
    description: 'Creamy, dairy-like.',
  },
  {
    id: 'mint',
    name: 'Mint',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.mint,
    description: 'Cool minty notes.',
  },
  {
    id: 'herbal_fresh',
    name: 'Herbal (Fresh)',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.herbal_fresh,
    description: 'Fresh herbaceous green.',
  },
  {
    id: 'green_leaf',
    name: 'Green Leaf',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.green_leaf,
    description: 'Fresh leafy green aroma.',
  },

  {
    id: 'floral_petals',
    name: 'Floral Petals',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.floral_petals,
    description: 'Delicate petals, floral.',
  },
  {
    id: 'herbal',
    name: 'Herbal',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.herbal,
    description: 'Earthy herbal profile.',
  },
  {
    id: 'citrus',
    name: 'Citrus',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.citrus,
    description: 'Orange, lemon, lime.',
  },
  {
    id: 'candy_sweet',
    name: 'Candy / Sweet',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.candy_sweet,
    description: 'Candy-like sweetness.',
  },
  {
    id: 'balanced_leaf',
    name: 'Balanced Leaf',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.balanced_leaf,
    description: 'Neutral leafy balance.',
  },
  {
    id: 'woody',
    name: 'Woody',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.woody,
    description: 'Dry wood, oak-like.',
  },
  {
    id: 'pinecone_woody',
    name: 'Pinecone (Woody)',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.pinecone_woody,
    description: 'Resinous pinecone aroma.',
  },
  {
    id: 'pine',
    name: 'Pine',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.pine,
    description: 'Forest pine / fresh needles.',
  },
  {
    id: 'fresh_herb',
    name: 'Fresh Herb',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.fresh_herb,
    description: 'Bright, garden-herb.',
  },
  {
    id: 'hops',
    name: 'Hops',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.hops,
    description: 'Bitter floral-hop tones.',
  },

  {
    id: 'lavender',
    name: 'Lavender',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.lavender,
    description: 'Lavender floral.',
  },
  {
    id: 'rose',
    name: 'Rose',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.rose,
    description: 'Rose petal aroma.',
  },
  {
    id: 'stone_fruit',
    name: 'Stone Fruit',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.stone_fruit,
    description: 'Peach/apricot notes.',
  },
  {
    id: 'tea',
    name: 'Tea',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.tea,
    description: 'Tea / herbal infusion.',
  },
  {
    id: 'sweet_flower',
    name: 'Sweet Flower',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.sweet_flower,
    description: 'Sweet perfume-like flower.',
  },
  {
    id: 'fresh_leaf',
    name: 'Fresh Leaf',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.fresh_leaf,
    description: 'Crisp fresh leaf scent.',
  },
  {
    id: 'floral_cluster',
    name: 'Floral Cluster',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.floral_cluster,
    description: 'Clustered floral notes.',
  },
  {
    id: 'green_leaf_fresh',
    name: 'Green Leaf (Fresh)',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.green_leaf_fresh,
    description: 'Bright green leaf.',
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.pinecone,
    description: 'Woody pinecone.',
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    category: 'flavor',
    iconIndex: FLAVOR_ICON_MAP.evergreen,
    description: 'Evergreen / resinous forest.',
  },
]

/* ---------------------------
   Convenience maps & helpers
   --------------------------- */

/** Map: id -> Item */
export const ITEM_BY_ID: Record<string, Item> = ITEMS.reduce(
  (acc, it) => {
    acc[it.id] = it
    return acc
  },
  {} as Record<string, Item>,
)

/** Get icon index by terpene or flavor id */
export function getIconFor(id: string): number | undefined {
  return ITEM_BY_ID[id]?.iconIndex
}

/** Get item by id */
export function getItem(id: string): Item | undefined {
  return ITEM_BY_ID[id]
}

/* ---------------------------
   Example usage
   --------------------------- */
// TERPENES // console.log(TERPENES);
// FLAVORS  // console.log(FLAVORS);
// ITEMS    // console.log(ITEMS);
// getIconFor('limonene') // -> 13

export default {
  TERPENES,
  FLAVORS,
  ITEMS,
  getIconFor,
  getItem,
  TERPENE_ICON_MAP,
  FLAVOR_ICON_MAP,
} as const
