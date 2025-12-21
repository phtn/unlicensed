import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useId, useMemo} from 'react'
import {profileIcons} from './product-profile-icons'

/**
 * ProductProfile Component
 *
 * Displays a product profile pill with an icon and name.
 * Automatically looks up the appropriate icon from profileIcons based on the name.
 * Falls back to a generic group icon (e, f, t) if no specific icon is found.
 *
 * @example
 * ```tsx
 * // Terpene example
 * <ProductProfile group="terpenes" name="Limonene" />
 *
 * // Flavor example
 * <ProductProfile group="flavors" name="Citrus" />
 *
 * // Effect example
 * <ProductProfile group="effects" name="Energetic" />
 *
 * // Works with various name formats (normalized automatically)
 * <ProductProfile group="terpenes" name="Alpha Pinene" /> // normalized to 'alpha_pinene'
 * <ProductProfile group="effects" name="Body High" /> // normalized to 'body_high'
 * ```
 */

interface IProductProfile {
  group: 'effects' | 'flavors' | 'terpenes'
  name: string
  label?: string
}

/**
 * Normalize name for icon lookup (lowercase, handle special cases)
 */
function normalizeIconName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Get profile icon by name, with fallback
 */
function getProfileIcon(
  name: string,
): (typeof profileIcons)[keyof typeof profileIcons] | null {
  const normalized = normalizeIconName(name)
  return normalized in profileIcons
    ? profileIcons[normalized as keyof typeof profileIcons]
    : null
}

export const ProductProfile = ({group, name}: IProductProfile) => {
  const id = useId()
  const iconData = useMemo(() => getProfileIcon(name), [name])
  const fallbackIcon = group[0] as IconName

  return (
    <div
      id={id}
      className={`flex items-center justify-between pl-1 pr-2 gap-0 rounded-full h-7 grow-0  bg-background/80 overflow-hidden`}>
      {iconData ? (
        <svg
          className={cn('shrink-0 size-7 aspect-square', {
            'text-effects': group === 'effects',
            'text-flavors': group === 'flavors',
            'text-terpenes': group === 'terpenes',
          })}
          viewBox={iconData.viewBox}
          fill='currentColor'
          xmlns='http://www.w3.org/2000/svg'
          dangerouslySetInnerHTML={{__html: iconData.symbol}}
        />
      ) : (
        <Icon
          name={fallbackIcon}
          className={cn('shrink-0 size-5 aspect-square', {
            'text-effects': group === 'effects',
            'text-flavors': group === 'flavors',
            'text-terpenes': group === 'terpenes',
          })}
        />
      )}
      <span className='text-sm font-light capitalize'>
        {name.split('_').join(' ')}
      </span>
    </div>
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

export const EFFECTS_ICON_MAP = {
  energetic: 13, // citrus - bright and energizing
  creative: 2, // floral - inspiring
  focused: 8, // mint - clear and sharp
  relaxed: 21, // lavender - calming
  sedated: 16, // woody - heavy and grounding
  comforted: 4, // sweet_floral - warm and comforting
  social: 3, // tropical - friendly and inviting
  bright: 13, // citrus - light and uplifting
  balanced: 15, // balanced_leaf - equilibrium
  relaxing: 5, // chamomile - soothing
  body_high: 16, // woody - physical sensation
  sleepy: 5, // chamomile - restful
  euphoric: 25, // sweet_flower - uplifting joy
  expansive: 2, // floral - open and wide
  blissful: 25, // sweet_flower - happy and content
  heavy: 16, // woody - weighty
  dreamy: 21, // lavender - ethereal
  chatty: 1, // berry - social and fun
  warm: 4, // sweet_floral - cozy
  uplifted: 13, // citrus - elevated mood
} as const

// Combined dataset, flattened arrays, and TypeScript types for terpenes, flavors & effects.
// Icons are referenced by index (1..30) from your sprite/image.

/* ---------------------------
   Types
   --------------------------- */

export type TerpeneName = keyof typeof TERPENE_ICON_MAP
export type FlavorName = keyof typeof FLAVOR_ICON_MAP
export type EffectName = keyof typeof EFFECTS_ICON_MAP
export type ItemCategory = 'terpene' | 'flavor' | 'effect'

export type Item = {
  /** machine key */
  id: string
  /** human-friendly display name */
  name: string
  /** 'terpene' | 'flavor' | 'effect' */
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
export const EFFECTS = Object.keys(EFFECTS_ICON_MAP) as EffectName[]

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

  // EFFECTS (20)
  {
    id: 'energetic',
    name: 'Energetic',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.energetic,
    description: 'Uplifting energy and vitality.',
  },
  {
    id: 'creative',
    name: 'Creative',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.creative,
    description: 'Inspires imagination and artistic flow.',
  },
  {
    id: 'focused',
    name: 'Focused',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.focused,
    description: 'Sharp mental clarity and concentration.',
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.relaxed,
    description: 'Calm and peaceful state.',
  },
  {
    id: 'sedated',
    name: 'Sedated',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.sedated,
    description: 'Deeply calming and tranquil.',
  },
  {
    id: 'comforted',
    name: 'Comforted',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.comforted,
    description: 'Warm and soothing comfort.',
  },
  {
    id: 'social',
    name: 'Social',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.social,
    description: 'Enhances sociability and connection.',
  },
  {
    id: 'bright',
    name: 'Bright',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.bright,
    description: 'Light and uplifting mood.',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.balanced,
    description: 'Harmonious equilibrium.',
  },
  {
    id: 'relaxing',
    name: 'Relaxing',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.relaxing,
    description: 'Soothing and stress-relieving.',
  },
  {
    id: 'body_high',
    name: 'Body High',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.body_high,
    description: 'Physical sensation and body relaxation.',
  },
  {
    id: 'sleepy',
    name: 'Sleepy',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.sleepy,
    description: 'Promotes rest and sleep.',
  },
  {
    id: 'euphoric',
    name: 'Euphoric',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.euphoric,
    description: 'Intense joy and happiness.',
  },
  {
    id: 'expansive',
    name: 'Expansive',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.expansive,
    description: 'Open and wide-reaching awareness.',
  },
  {
    id: 'blissful',
    name: 'Blissful',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.blissful,
    description: 'Deep contentment and peace.',
  },
  {
    id: 'heavy',
    name: 'Heavy',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.heavy,
    description: 'Weighty and grounding sensation.',
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.dreamy,
    description: 'Ethereal and floaty feeling.',
  },
  {
    id: 'chatty',
    name: 'Chatty',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.chatty,
    description: 'Enhances conversation and communication.',
  },
  {
    id: 'warm',
    name: 'Warm',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.warm,
    description: 'Cozy and comforting warmth.',
  },
  {
    id: 'uplifted',
    name: 'Uplifted',
    category: 'effect',
    iconIndex: EFFECTS_ICON_MAP.uplifted,
    description: 'Elevated mood and spirits.',
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

// profileIcons are imported from './product-profile-icons'

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
  EFFECTS,
  ITEMS,
  getIconFor,
  getItem,
  TERPENE_ICON_MAP,
  FLAVOR_ICON_MAP,
  EFFECTS_ICON_MAP,
} as const
