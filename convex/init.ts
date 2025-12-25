import type {AnyDataModel, GenericDatabaseWriter} from 'convex/server'

type CategorySeed = {
  name: string
  slug: string
  description: string
  heroImage: string
  highlight?: string
  benefits?: string[]
}

type SetupContext = {
  db: GenericDatabaseWriter<AnyDataModel>
}

type ProductSeed = {
  name: string
  slug: string
  categorySlug: string
  shortDescription: string
  description: string
  priceCents: number
  unit: string
  availableDenominations: number[]
  popularDenomination: number[]
  thcPercentage: number
  cbdPercentage?: number
  effects: string[]
  terpenes: string[]
  featured: boolean
  available: boolean
  stock: number
  rating: number
  image: string
  gallery: string[]
  consumption: string
  flavorNotes: string[]
  potencyProfile?: string
  weightGrams?: number
}

export const categoriesSeed: CategorySeed[] = [
  {
    name: 'Flower',
    slug: 'flower',
    description:
      'Single-origin flower cultivated in small batches for expressive terpene profiles.',
    highlight: 'Grown in living soil with regenerative farming practices.',
    benefits: ['Full-spectrum cannabinoid expression', 'Rich terpene bouquet'],
    heroImage:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Slurricane_transparent.png?v=1759173573&width=1488',
  },
  {
    name: 'Edibles',
    slug: 'edibles',
    description:
      'Chef-crafted edibles designed for consistent dosing and delightful flavor.',
    highlight: 'Low-and-slow onset for a smooth, extended experience.',
    benefits: ['Precisely dosed servings', 'Vegan and gluten-free options'],
    heroImage:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Chillout_25mg_d8.png?v=1723894235&width=600',
  },
  {
    name: 'Concentrates',
    slug: 'concentrates',
    description:
      'High-potency extracts showcasing the pure essence of each cultivar.',
    highlight: 'Cold-cured and single-source for maximum expression.',
    benefits: ['Potent cannabinoid content', 'Preserves native terpenes'],
    heroImage: `https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Thca_diamond.png?v=1734635477&width=600`,
  },
  {
    name: 'Drinks',
    slug: 'drinks',
    description:
      'Sparkling beverages infused with nano-emulsified THC for fast onset.',
    highlight: 'Zero sugar, uplifting botanicals, and vibrant flavors.',
    benefits: ['15-minute onset window', 'Balanced cannabinoid ratios'],
    heroImage: `https://cdn.shopify.com/s/files/1/0693/8119/3966/files/SleepytimeHotCocoaAdvanced_PLP_JuanStock_18092025.png?v=1758209621&width=600`,
  },
  {
    name: 'Pre-rolls',
    slug: 'pre-rolls',
    description:
      'Thoughtfully blended pre-rolls for effortless sessions on the go.',
    highlight: 'Hand-finished cones with slow, even burn.',
    benefits: ['Convenient format', 'Curated terpene experiences'],
    heroImage:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Strawberries_Bananas.png?v=1734635190&width=600',
  },
]

export const productsSeed: ProductSeed[] = [
  {
    name: 'rainbow-runtz',
    slug: 'rainbow-runtz',
    categorySlug: 'flower',
    shortDescription:
      'Citrus-forward sativa with energetic clarity and a crisp finish.',
    description:
      'Sunrise Sativa is grown in living soil under full-spectrum LEDs to preserve delicate terpenes. Expect an uplifting, creative experience with clean energy that fades into a gentle focus.',
    priceCents: 4200,
    unit: 'g',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 24.1,
    cbdPercentage: 0.2,
    effects: ['Energetic', 'Creative', 'Focused'],
    terpenes: ['Limonene', 'Pinene', 'Ocimene'],
    featured: true,
    available: true,
    stock: 42,
    rating: 4.7,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/DarkRainbow_transparent.png?v=1759172600&width=1488',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/SuperLemonHaze_transparent.png?v=1759171126&width=1488',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/GeniusGlow_transparent.png?v=1759170612&width=1488',
    ],
    consumption:
      'Grind loosely and enjoy in a clean glass piece or hand-rolled joint. Start with a small inhale to gauge potency.',
    flavorNotes: ['Sweet citrus zest', 'Fresh pine', 'Honeyed earth'],
    potencyProfile: 'Smooth onset with sustained, bubbly energy.',
    weightGrams: 3.5,
  },
  {
    name: 'Moonlit Indica Flower',
    slug: 'moonlit-indica-flower',
    categorySlug: 'flower',
    shortDescription:
      'Deeply relaxing indica with lavender aroma and velvet texture.',
    description:
      'Moonlit Indica is an evening cultivar dialed in for restorative rest. Purple buds release lavender and berry aromatics, settling the body with a cozy, weighted calm.',
    priceCents: 4400,
    unit: 'g',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 26.3,
    effects: ['Relaxed', 'Sedated', 'Comforted'],
    terpenes: ['Linalool', 'Myrcene', 'Caryophyllene'],
    featured: false,
    available: true,
    stock: 34,
    rating: 4.8,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/DantesInferno_transparent.png?v=1759173638&width=1488',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/SuperGoof_transparent.png?v=1759173080&width=1488',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/TrapCherries_transparent.png?v=1759171852&width=1488',
    ],
    consumption:
      'Pack loosely in a small bowl or vape at low temps to preserve linalool. Sip water between draws.',
    flavorNotes: ['Crushed berries', 'Lavender', 'Warm spice'],
    potencyProfile: 'Heavier body relaxation with gentle mental hush.',
    weightGrams: 3.5,
  },
  {
    name: 'Citrus Bloom Gummies',
    slug: 'citrus-bloom-gummies',
    categorySlug: 'edibles',
    shortDescription:
      'Vegan gummies with bright grapefruit and yuzu, 5mg THC each.',
    description:
      'A chef-led recipe using cold-pressed citrus and nano-emulsified THC for a crisp, uplifting edible. Balanced with guava nectar for a lush finish.',
    priceCents: 2800,
    unit: '10-pack (5mg each)',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 5,
    effects: ['Social', 'Bright', 'Balanced'],
    terpenes: ['Valencene', 'Limonene'],
    featured: true,
    available: true,
    stock: 88,
    rating: 4.6,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Chillout_25mg_d8.png?v=1723894235&width=600',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Morning_D9.png?v=1734634997&width=600',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/50mgDelta8Gummies_PLP_StephRenders_15082025.png?v=1755527514&width=600',
    ],
    consumption:
      'Start with one gummy, wait 60-90 minutes before considering another serving.',
    flavorNotes: ['Ruby grapefruit', 'Yuzu zest', 'Guava nectar'],
    potencyProfile: 'Gentle lift with balanced mood elevation.',
  },
  {
    name: 'Midnight Velvet Chocolates',
    slug: 'midnight-velvet-chocolates',
    categorySlug: 'edibles',
    shortDescription:
      'Single-origin dark chocolate ganache infused with 10mg THC.',
    description:
      'Crafted with 72% Dominican cacao, these ganache bites melt into a slow-building body warmth perfect for deep relaxation.',
    priceCents: 3200,
    unit: '6-piece box (10mg each)',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 10,
    effects: ['Relaxing', 'Body high', 'Sleepy'],
    terpenes: ['Myrcene', 'Humulene'],
    featured: false,
    available: true,
    stock: 53,
    rating: 4.9,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/MindfulBrownieBites_PLP_ScottPhotos_13052025.png?v=1750093452&width=600',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Brownie_bites.png?v=1734645873&width=600',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Chocolate_chip_cookie.png?v=1734639004&width=600',
    ],
    consumption:
      'Enjoy after dinner. Allow chocolate to melt slowly for best terpene expression.',
    flavorNotes: ['Dark cacao', 'Toasted hazelnut', 'Vanilla bean'],
    potencyProfile: 'Slow onset with deep, enveloping calm.',
  },
  {
    name: 'Glasshouse Live Resin',
    slug: 'glasshouse-live-resin',
    categorySlug: 'concentrates',
    shortDescription: 'Fresh frozen live resin diamonds in terpene-rich sauce.',
    description:
      'Fresh frozen whole flower processed within hours of harvest to capture peak terpene fidelity. Expect a euphoric, immersive ride.',
    priceCents: 6000,
    unit: '1g jar',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 76.4,
    cbdPercentage: 1.1,
    effects: ['Euphoric', 'Expansive', 'Creative'],
    terpenes: ['Limonene', 'Caryophyllene', 'Bisabolol'],
    featured: true,
    available: true,
    stock: 27,
    rating: 4.8,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/D8_thc_moonrocks.png?v=1723894390&width=600',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/CosmicMoonrocks_PLP_AdrianRenders_31072025.png?v=1755191711&width=600',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Thca_moonrocks.png?v=1723897457&width=600',
    ],
    consumption:
      'Best enjoyed at low temperatures (480-520°F). Allow terpenes to vaporize before inhaling deeply.',
    flavorNotes: ['Candied lemon', 'Floral spice', 'Honeydew'],
    potencyProfile: 'Fast-peaking, head-forward rush with sparkling finish.',
  },
  {
    name: 'Glacier Cold Cure Rosin',
    slug: 'glacier-cold-cure-rosin',
    categorySlug: 'concentrates',
    shortDescription:
      'Cold cure hash rosin with silky texture and vivid terpene expression.',
    description:
      'Solventless rosin pressed from hand-washed fresh frozen material. A decadent treat for enthusiasts chasing boutique terpene profiles.',
    priceCents: 7200,
    unit: '1g jar',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 78.9,
    effects: ['Blissful', 'Heavy', 'Dreamy'],
    terpenes: ['Myrcene', 'Limonene', 'Linalool'],
    featured: false,
    available: true,
    stock: 18,
    rating: 4.9,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/ClassicHash_PLP_AdrianRenders_20012025.png?v=1748959476&width=600',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/THCaIceQueenDabBadder_PLP_AdrianRenders_20012025.png?v=1748958382&width=600',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Caribbean_dream_hash.png?v=1734634566&width=600',
    ],
    consumption:
      'Use a cold-start dab or dynamic induction heater to savor the delicate top notes.',
    flavorNotes: ['Chamomile', 'Citrus rind', 'Berry jam'],
    potencyProfile: 'Thick, enveloping relaxation with long tail.',
  },
  {
    name: 'Canna Fizz Golden Hour',
    slug: 'canna-fizz-golden-hour',
    categorySlug: 'drinks',
    shortDescription:
      'Sparkling mango chamomile beverage with 5mg fast-onset THC.',
    description:
      'Golden Hour pairs juicy mango with calming chamomile and jasmine green tea for a sunset-ready sip.',
    priceCents: 1800,
    unit: '12oz can',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 5,
    effects: ['Balanced', 'Chatty', 'Warm'],
    terpenes: ['Limonene', 'Bisabolol'],
    featured: false,
    available: true,
    stock: 64,
    rating: 4.5,
    image:
      'https://a-us.storyblok.com/f/1021976/1080x1080/4815ffe35b/beverages.jpg/m/',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/BoostPreWorkout_PLP_StephRender_31012025.png?v=1755286332&width=600',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/SleepytimeHotCocoaAdvanced_PLP_JuanStock_18092025.png?v=1758209621&width=600',
    ],
    consumption:
      'Serve chilled over ice. Expect onset in 15-20 minutes thanks to nano-emulsification.',
    flavorNotes: ['Ripe mango', 'Chamomile tea', 'Citrus spritz'],
    potencyProfile: 'Bright sociable energy with serene landing.',
  },
  {
    name: 'Trailhead Micro Pre-rolls',
    slug: 'trailhead-micro-pre-rolls',
    categorySlug: 'pre-rolls',
    shortDescription:
      'Seven 0.5g pre-rolls blended for daytime adventures and shared sessions.',
    description:
      'Trailhead features a curated blend of uplifting cultivars rolled into slow-burning mini cones for easy pacing.',
    priceCents: 3600,
    unit: '7-pack (0.5g each)',
    availableDenominations: [1, 3.5, 7, 14, 28],
    popularDenomination: [3.5],
    thcPercentage: 22.5,
    effects: ['Uplifted', 'Social', 'Creative'],
    terpenes: ['Pinene', 'Terpinolene', 'Limonene'],
    featured: true,
    available: true,
    stock: 51,
    rating: 4.6,
    image:
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Boogie_woogie.png?v=1734634533&width=600',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Wedding_cake.png?v=1734635536&width=600',
      'https://cdn.shopify.com/s/files/1/0693/8119/3966/files/Jeffrey_PLP_AdrianRenders_07042025.png?v=1744872691&width=600',
    ],
    consumption:
      'Spark a micro pre-roll for a steady 3-4 hit session. Ideal for group hikes and quick breaks.',
    flavorNotes: ['Pine forest', 'Citrus peel', 'Wildflower'],
    potencyProfile: 'Smooth uplift with clear finish and light body glow.',
  },
]

const DEFAULT_STAT_CONFIGS = [
  {id: 'salesToday', label: 'Sales Today', visible: true, order: 0},
  {id: 'pendingOrders', label: 'Pending Orders', visible: true, order: 1},
  {id: 'deliveries', label: 'Deliveries', visible: true, order: 2},
  {id: 'totalRevenue', label: 'Total Revenue', visible: true, order: 3},
  {id: 'totalUsers', label: 'Total Users', visible: true, order: 4},
  {id: 'totalProducts', label: 'Total Products', visible: true, order: 5},
  {
    id: 'averageOrderValue',
    label: 'Average Order Value',
    visible: true,
    order: 6,
  },
  {id: 'cancelledOrders', label: 'Cancelled Orders', visible: true, order: 7},
  {id: 'salesThisWeek', label: 'Sales This Week', visible: false, order: 8},
  {id: 'salesThisMonth', label: 'Sales This Month', visible: false, order: 9},
]

export default async function init(ctx: SetupContext) {
  // Seed admin settings with statConfigs (always check, independent of categories)
  const allAdminSettings = await ctx.db.query('adminSettings').collect()
  const existingAdminSettings = allAdminSettings.find(
    (s) => s.identifier === 'statConfigs',
  )

  if (!existingAdminSettings) {
    // Check if there's an existing adminSettings without identifier (legacy)
    const legacySettings = allAdminSettings[0]

    if (legacySettings) {
      // Update existing settings to add identifier
      await ctx.db.patch(legacySettings._id, {
        identifier: 'statConfigs',
      })
    } else {
      // Create new admin settings
      await ctx.db.insert('adminSettings', {
        identifier: 'statConfigs',
        value: {statConfigs: DEFAULT_STAT_CONFIGS},
        updatedAt: Date.now(),
        createdAt: Date.now(),
        createdBy: 'init-script',
      })
    }
  }

  // Seed IPAPI geolocation setting (enabled: false by default)
  const existingIpapiSetting = allAdminSettings.find(
    (s) => s.identifier === 'ipapiGeolocation',
  )

  if (!existingIpapiSetting) {
    await ctx.db.insert('adminSettings', {
      identifier: 'ipapiGeolocation',
      value: {enabled: false},
      updatedAt: Date.now(),
      createdAt: Date.now(),
      createdBy: 'init-script',
    })
  } else {
    // Ensure it's set to disabled if it exists
    const currentValue = existingIpapiSetting.value as {enabled?: boolean} | undefined
    if (currentValue?.enabled !== false) {
      await ctx.db.patch(existingIpapiSetting._id, {
        value: {enabled: false},
        updatedAt: Date.now(),
      })
    }
  }

  // Seed categories and products (only if they don't exist)
  const existing = await ctx.db.query('categories').take(1)
  if (existing.length > 0) {
    return
  }

  const categoryIdBySlug = new Map<string, string>()

  for (const category of categoriesSeed) {
    const id = await ctx.db.insert('categories', category)
    categoryIdBySlug.set(category.slug, id)
  }

  for (const product of productsSeed) {
    const categoryId = categoryIdBySlug.get(product.categorySlug)
    if (!categoryId) {
      continue
    }

    await ctx.db.insert('products', {
      ...product,
      categoryId,
    })
  }
}
