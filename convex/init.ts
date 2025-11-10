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
      'https://images.unsplash.com/photo-1542996966-2e31c00bae30?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Edibles',
    slug: 'edibles',
    description:
      'Chef-crafted edibles designed for consistent dosing and delightful flavor.',
    highlight: 'Low-and-slow onset for a smooth, extended experience.',
    benefits: ['Precisely dosed servings', 'Vegan and gluten-free options'],
    heroImage:
      'https://images.unsplash.com/photo-1528838068211-1f49906c754b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Concentrates',
    slug: 'concentrates',
    description:
      'High-potency extracts showcasing the pure essence of each cultivar.',
    highlight: 'Cold-cured and single-source for maximum expression.',
    benefits: ['Potent cannabinoid content', 'Preserves native terpenes'],
    heroImage:
      'https://images.unsplash.com/photo-1611242320536-72cfa7b0db18?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Drinks',
    slug: 'drinks',
    description:
      'Sparkling beverages infused with nano-emulsified THC for fast onset.',
    highlight: 'Zero sugar, uplifting botanicals, and vibrant flavors.',
    benefits: ['15-minute onset window', 'Balanced cannabinoid ratios'],
    heroImage:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1400&q=80',
  },
  {
    name: 'Pre-rolls',
    slug: 'pre-rolls',
    description:
      'Thoughtfully blended pre-rolls for effortless sessions on the go.',
    highlight: 'Hand-finished cones with slow, even burn.',
    benefits: ['Convenient format', 'Curated terpene experiences'],
    heroImage:
      'https://images.unsplash.com/photo-1511912919394-65ba03fdaab4?auto=format&fit=crop&w=1400&q=80',
  },
]

export const productsSeed: ProductSeed[] = [
  {
    name: 'Sunrise Sativa Flower',
    slug: 'sunrise-sativa-flower',
    categorySlug: 'flower',
    shortDescription:
      'Citrus-forward sativa with energetic clarity and a crisp finish.',
    description:
      'Sunrise Sativa is grown in living soil under full-spectrum LEDs to preserve delicate terpenes. Expect an uplifting, creative experience with clean energy that fades into a gentle focus.',
    priceCents: 4200,
    unit: '3.5g jar',
    thcPercentage: 24.1,
    cbdPercentage: 0.2,
    effects: ['Energetic', 'Creative', 'Focused'],
    terpenes: ['Limonene', 'Pinene', 'Ocimene'],
    featured: true,
    available: true,
    stock: 42,
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1503262028195-93c528f03218?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1771',
    gallery: [
      'https://images.unsplash.com/photo-1597354674911-453bc2c00e4a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1151',
      'https://images.unsplash.com/photo-1681310375919-dfe1275373a7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1772',
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
    unit: '3.5g jar',
    thcPercentage: 26.3,
    effects: ['Relaxed', 'Sedated', 'Comforted'],
    terpenes: ['Linalool', 'Myrcene', 'Caryophyllene'],
    featured: false,
    available: true,
    stock: 34,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1693074713415-ee591ea0af99?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=654',
    gallery: [
      'https://images.unsplash.com/photo-1608889175123-8c2267a5133c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80',
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
    thcPercentage: 5,
    effects: ['Social', 'Bright', 'Balanced'],
    terpenes: ['Valencene', 'Limonene'],
    featured: true,
    available: true,
    stock: 88,
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1617627191898-1408bf607b4d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1751',
    gallery: [
      'https://images.unsplash.com/photo-1604908176997-12518821c8ef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
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
    thcPercentage: 10,
    effects: ['Relaxing', 'Body high', 'Sleepy'],
    terpenes: ['Myrcene', 'Humulene'],
    featured: false,
    available: true,
    stock: 53,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1618427105274-f3a4f72f8104?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1770',
    gallery: [
      'https://images.unsplash.com/photo-1526081347589-6b2507040a40?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80',
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
    thcPercentage: 76.4,
    cbdPercentage: 1.1,
    effects: ['Euphoric', 'Expansive', 'Creative'],
    terpenes: ['Limonene', 'Caryophyllene', 'Bisabolol'],
    featured: true,
    available: true,
    stock: 27,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1711748975720-c778c8b4c65c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1180',
    gallery: [
      'https://images.unsplash.com/photo-1608889639994-5ac1b57f62c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580158004218-66b1daee88a8?auto=format&fit=crop&w=1200&q=80',
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
    thcPercentage: 78.9,
    effects: ['Blissful', 'Heavy', 'Dreamy'],
    terpenes: ['Myrcene', 'Limonene', 'Linalool'],
    featured: false,
    available: true,
    stock: 18,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1711748975715-e9aea2bc9db1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1180',
    gallery: [
      'https://images.unsplash.com/photo-1608889641257-9eae0492a1dc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=80',
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
    thcPercentage: 5,
    effects: ['Balanced', 'Chatty', 'Warm'],
    terpenes: ['Limonene', 'Bisabolol'],
    featured: false,
    available: true,
    stock: 64,
    rating: 4.5,
    image:
      'https://images.unsplash.com/photo-1610740654896-e23a29ae43c6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1770',
    gallery: [
      'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1558642084-fd07fae5282c?auto=format&fit=crop&w=1200&q=80',
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
    thcPercentage: 22.5,
    effects: ['Uplifted', 'Social', 'Creative'],
    terpenes: ['Pinene', 'Terpinolene', 'Limonene'],
    featured: true,
    available: true,
    stock: 51,
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1695326463324-9a45f1e343f7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1770',
    gallery: [
      'https://images.unsplash.com/photo-1619606323485-4570a1c2c763?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542996966-2e31c00bae30?auto=format&fit=crop&w=1200&q=80',
    ],
    consumption:
      'Spark a micro pre-roll for a steady 3-4 hit session. Ideal for group hikes and quick breaks.',
    flavorNotes: ['Pine forest', 'Citrus peel', 'Wildflower'],
    potencyProfile: 'Smooth uplift with clear finish and light body glow.',
  },
]

export default async function init(ctx: SetupContext) {
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
