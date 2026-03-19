import {FormInput, SelectOption} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {z} from 'zod'

type AttributeEntry = {name: string; slug: string}

/** Legacy: tier as string[]. New: tier as AttributeEntry[]. */
function tierEntries(
  categorySlug: string | undefined,
  categories: Array<{
    slug?: string
    _id: string
    tiers?: string[] | AttributeEntry[]
  }>,
): AttributeEntry[] {
  if (!categorySlug || !categories.length) return []
  const cat = categories.find((c) => (c.slug ?? c._id) === categorySlug)
  const raw = cat?.tiers
  if (!raw?.length) return []
  const first = raw[0]
  if (typeof first === 'string') {
    return (raw as string[]).map((s) => ({
      name: s,
      slug: s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    }))
  }
  return raw as AttributeEntry[]
}

/** Resolve a stored value (name or slug) to the option slug for selects. */
export function resolveAttributeValue(
  value: string | undefined,
  options: SelectOption[],
): string | undefined {
  if (!value?.trim()) return undefined
  const v = value.trim()
  const byValue = options.find((o) => o.value === v)
  if (byValue) return byValue.value
  const byLabel = options.find((o) => o.label === v)
  return byLabel?.value ?? (options.some((o) => o.value === v) ? v : undefined)
}

export function resolveAttributeValues(
  values: string[] | string | undefined,
  options: SelectOption[],
): string[] {
  const rawValues = Array.isArray(values)
    ? values
    : values?.trim()
      ? [values]
      : []

  return [
    ...new Set(
      rawValues
        .map((value) => resolveAttributeValue(value, options) ?? value)
        .filter((value): value is string => !!value?.trim()),
    ),
  ]
}

/** Returns tier select options: value = slug (for querying), label = name. */
export function getProductTierOptionsByCategory(
  categorySlug: string | undefined,
  categories: Array<{
    slug?: string
    _id: string
    tiers?: string[] | AttributeEntry[]
  }>,
): SelectOption[] {
  return tierEntries(categorySlug, categories).map((e) => ({
    value: e.slug,
    label: e.name,
  }))
}

type CategoryForOptions = {
  slug?: string
  _id: string
  bases?: string[] | AttributeEntry[]
  brands?: string[] | AttributeEntry[]
}

function baseEntries(
  categorySlug?: string,
  categories?: CategoryForOptions[],
): AttributeEntry[] {
  if (!categorySlug || !categories?.length) return []
  const cat = categories.find((c) => (c.slug ?? c._id) === categorySlug)
  const raw = cat?.bases
  if (!raw?.length) return []
  const first = raw[0]
  if (typeof first === 'string') {
    return (raw as string[]).map((s) => ({
      name: s,
      slug: s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    }))
  }
  return raw as AttributeEntry[]
}

/** Returns base options configured on the selected category. */
export const getProductBaseOptionsByCategory = (
  categorySlug?: string,
  categories?: CategoryForOptions[],
): SelectOption[] => {
  const entries = baseEntries(categorySlug, categories)
  return entries.map((e) => ({value: e.slug, label: e.name}))
}

function brandEntries(
  categorySlug: string | undefined,
  categories: Array<{
    slug?: string
    _id: string
    brands?: string[] | AttributeEntry[]
  }>,
): AttributeEntry[] {
  if (!categorySlug || !categories.length) return []
  const cat = categories.find((c) => (c.slug ?? c._id) === categorySlug)
  const raw = cat?.brands
  if (!raw?.length) return []
  const first = raw[0]
  if (typeof first === 'string') {
    return (raw as string[]).map((s) => ({
      name: s,
      slug: s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    }))
  }
  return raw as AttributeEntry[]
}

/** Returns brand select options: value = slug, label = name. */
export const getProductBrandOptionsByCategory = (
  categorySlug: string | undefined,
  categories: Array<{
    slug?: string
    _id: string
    brands?: string[] | AttributeEntry[]
  }>,
): SelectOption[] => {
  return brandEntries(categorySlug, categories).map((e) => ({
    value: e.slug,
    label: e.name,
  }))
}

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  base: z.string().optional(),
  categorySlug: z.string().min(1, 'Select a category.'),
  brand: z.array(z.string()).optional(),
  productTier: z.string().optional(),
  subcategory: z.string().optional(),
  shortDescription: z.optional(
    z.string().min(0, 'Short description is required.'),
  ),
  description: z.optional(
    z.string().min(0, 'Description must be at least 20 characters.'),
  ),
  priceCents: z.number().min(0, 'Price must be positive.'),
  unit: z.string().min(1, 'Unit is required.'),
  availableDenominationsRaw: z.string().optional(),
  popularDenomination: z
    .union([z.array(z.number()), z.literal('')])
    .optional()
    .transform((val) =>
      Array.isArray(val) && val.length > 0 ? val : undefined,
    ),
  thcPercentage: z.number().min(0, 'THC percentage must be positive.'),
  cbdPercentage: z.string().optional(),
  effectsRaw: z.string().optional(), // Keep for backward compatibility or parse elsewhere
  effects: z.array(z.string()).optional(), // New array field
  terpenesRaw: z.string().optional(), // Keep for backward compatibility
  terpenes: z.array(z.string()).optional(), // New array field
  flavors: z.array(z.string()).optional(), // New array field
  flavorNotesRaw: z.string().optional(), // Keep for backward compatibility
  featured: z.boolean(),
  available: z.boolean(),
  eligibleForRewards: z.boolean(),
  eligibleForDeals: z.optional(z.boolean()),
  onSale: z.optional(z.boolean()),
  inventoryMode: z
    .enum(['by_denomination', 'shared'])
    .default('by_denomination'),
  stock: z.optional(z.number().min(0, 'Stock must be positive.')),
  masterStockQuantity: z.optional(
    z.number().min(0, 'Master stock must be 0 or more.'),
  ),
  masterStockUnit: z.string().optional(),
  /** Per-denomination inventory. Key = denomination as string (e.g. "0.125", "1"), value = count. */
  stockByDenomination: z.optional(
    z.record(z.string(), z.number().min(0, 'Stock must be 0 or more.')),
  ),
  /** Per-denomination price in dollars. Key = denomination as string (e.g. "0.125", "1", "3.5"), value = price. */
  priceByDenomination: z.optional(
    z.record(z.string(), z.number().min(0, 'Price must be 0 or more.')),
  ),
  rating: z.optional(
    z
      .number()
      .min(0, 'Rating must be at least 0.')
      .max(5, 'Rating must be 5 or less.'),
  ),
  image: z
    .string()
    .min(0, 'Upload a primary image or provide a URL/storage ID.'),
  gallery: z.optional(z.array(z.string())),
  consumption: z.optional(
    z.string().min(0, 'Consumption guidance is required.'),
  ),
  potencyLevel: z.enum(['mild', 'medium', 'high']),
  potencyProfile: z.string().optional(),
  lineage: z.string().optional(),
  productType: z.string().optional(),
  strainType: z.string().optional(),
  noseRating: z
    .number()
    .min(0, 'Nose rating must be 0 or more.')
    .max(10, 'Nose rating must be 10 or less.')
    .optional(),
  weightGrams: z.string().optional(),
  netWeight: z.string().optional(),
  netWeightUnit: z.string().optional(),
  packagingMode: z.enum(['bulk', 'prepack']).optional(),
  stockUnit: z.string().optional(),
  packSize: z.string().optional(),
  startingWeight: z.string().optional(),
  remainingWeight: z.string().optional(),
  batchId: z.string().optional(),
  variants: z
    .array(
      z.object({
        label: z.string(),
        price: z.number(),
      }),
    )
    .optional(),
  tier: z.string().optional(),
  eligibleForUpgrade: z.boolean().optional(),
  upgradePrice: z
    .number()
    .min(0, 'Upgrade price must be 0 or more.')
    .optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

// Form API type - simplified for TanStack Form composition
// The form from useAppForm has Field, AppField, setFieldValue, etc.
// Using a permissive type that accepts the actual form instance
export type ProductFormApi = ReturnType<typeof useAppForm>
export type ProductFormApi2 = {
  AppField: <TName extends keyof ProductFormValues>(props: {
    name: TName
    children?: (field: {
      state: {
        value: ProductFormValues[TName]
        meta: {isTouched: boolean; errors: string[]}
      }
      handleChange: (value: ProductFormValues[TName]) => void
      handleBlur: () => void
      setValue: (value: ProductFormValues[TName]) => void
    }) => React.ReactNode
  }) => React.ReactNode
  Field: (props: {
    name: string
    component?: string
    children?: unknown
    [key: string]: unknown
  }) => React.ReactNode
  setFieldValue: (name: string, value: unknown) => void
  getFieldValue: (name: string) => unknown
  handleSubmit: () => void | Promise<void>
  store: unknown
} & Record<string, unknown>

export const productFields: FormInput<ProductFormValues>[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    placeholder: 'Product name',
    defaultValue: '',
  },
  {
    name: 'slug',
    type: 'text',
    label: 'Slug',
    required: false,
    placeholder: 'product-slug (auto-generated if empty)',
    defaultValue: '',
  },
  {
    name: 'base',
    label: 'Base',
    required: false,
    type: 'select',
    mode: 'single',
    options: [],
    placeholder: 'Select base',
    defaultValue: '',
  },
  {
    name: 'categorySlug',
    label: 'Category',
    required: true,
    type: 'select',
    options: [], // Populated dynamically from categories
    defaultValue: '',
  },
  {
    name: 'strainType',
    label: 'Strain Type',
    required: false,
    type: 'select',
    options: [],
    placeholder: 'Strain Type',
    defaultValue: '',
  },
  {
    name: 'brand',
    label: 'Brand',
    required: false,
    type: 'select',
    mode: 'multiple',
    options: [], // Populated from category brands in BasicInfo
    placeholder: 'Select brands',
    defaultValue: [],
  },
  {
    name: 'tier',
    label: 'Tier',
    required: false,
    type: 'select',
    options: [], // Filled from Convex adminSettings (productTiers) in BasicInfo
    placeholder: 'Select tier',
    defaultValue: '',
  },
  {
    name: 'subcategory',
    label: 'Subcategory',
    required: false,
    type: 'select',
    options: [], // Populated from category subcategories in BasicInfo
    placeholder: 'Cartridge, Disposable, Pod',
    defaultValue: '',
  },
  {
    name: 'batchId',
    label: 'Batch ID',
    required: false,
    type: 'text',
    placeholder: '2604',
    defaultValue: '',
  },
  {
    name: 'productType',
    label: 'Product Type',
    required: false,
    type: 'text',
    placeholder: '',
    defaultValue: '',
  },
  {
    name: 'image',
    label: 'Primary Image',
    required: true,
    type: 'text',
    placeholder: 'Image URL or storage ID',
    defaultValue: 'kg2c1s5svzexeqx3ft64e7cpmh80s5g2',
  },
  {
    name: 'gallery',
    label: 'Gallery',
    required: true,
    type: 'textarea',
    placeholder: 'Image URLs separated by commas or newlines',
    defaultValue: [],
  },

  {
    name: 'priceCents',
    label: 'Price ($)',
    required: true,
    type: 'number',
    placeholder: '0.00',
    defaultValue: 0,
  },
  {
    name: 'unit',
    label: 'Unit',
    required: true,
    type: 'text',
    placeholder: 'e.g., g, oz, ml',
    defaultValue: '',
  },
  {
    name: 'availableDenominationsRaw',
    label: 'Available Denominations',
    required: false,
    type: 'select',
    placeholder: 'e.g., 1/8, 1/4, 1, 2',
    options: [], // Populated dynamically from categories
    mode: 'multiple',
    defaultValue: '',
  },
  {
    name: 'popularDenomination',
    label: 'Popular Denomination',
    required: false,
    type: 'select',
    mode: 'single',
    options: [], // Populated dynamically from categories
    defaultValue: [] as number[],
  },

  {
    name: 'shortDescription',
    label: 'Short Description',
    required: true,
    type: 'textarea',
    placeholder: 'Brief product description (min 10 characters)',
    defaultValue: '',
  },
  {
    name: 'description',
    label: 'Description',
    required: true,
    type: 'textarea',
    placeholder: 'Full product description (min 20 characters)',
    defaultValue: '',
  },

  {
    name: 'thcPercentage',
    label: 'THC Percentage',
    required: true,
    type: 'number',
    placeholder: '0.00',
    defaultValue: 0,
  },
  {
    name: 'cbdPercentage',
    label: 'CBD Percentage',
    required: false,
    type: 'text',
    placeholder: '0.00 (optional)',
    defaultValue: '',
  },
  {
    name: 'effectsRaw',
    label: 'Effects (Raw)',
    required: false,
    type: 'textarea',
    placeholder: 'Comma-separated effects (for backward compatibility)',
    defaultValue: '',
  },
  {
    name: 'terpenesRaw',
    label: 'Terpenes (Raw)',
    required: false,
    type: 'textarea',
    placeholder: 'Comma-separated terpenes (for backward compatibility)',
    defaultValue: '',
  },
  {
    name: 'flavorNotesRaw',
    label: 'Flavor Notes (Raw)',
    required: false,
    type: 'textarea',
    placeholder: 'Comma-separated flavor notes (for backward compatibility)',
    defaultValue: '',
  },
  {
    name: 'featured',
    label: 'Featured',
    required: true,
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'available',
    label: 'Available',
    required: true,
    type: 'checkbox',
    defaultValue: true,
  },
  {
    name: 'eligibleForDeals',
    label: 'Eligible for Deals',
    required: false,
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'eligibleForRewards',
    label: 'Eligible for Rewards',
    required: true,
    type: 'checkbox',
    defaultValue: true,
  },
  {
    name: 'onSale',
    label: 'On Sale',
    required: false,
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'rating',
    label: 'Rating',
    required: true,
    type: 'number',
    placeholder: '0.0 - 5.0',
    defaultValue: 0,
  },

  {
    name: 'consumption',
    label: 'Consumption Guidance',
    required: true,
    type: 'textarea',
    placeholder: 'How to consume this product (min 5 characters)',
    defaultValue: '',
  },
  {
    name: 'potencyLevel',
    label: 'Potency Level',
    required: true,
    type: 'select',
    options: [
      {value: 'mild', label: 'Mild'},
      {value: 'medium', label: 'Medium'},
      {value: 'high', label: 'High'},
    ],
    defaultValue: 'medium',
  },
  {
    name: 'potencyProfile',
    label: 'Potency Profile',
    required: false,
    type: 'textarea',
    placeholder: 'Detailed potency information',
    defaultValue: '',
  },
  {
    name: 'weightGrams',
    label: 'Weight (grams)',
    required: false,
    type: 'text',
    placeholder: 'Product weight in grams',
    defaultValue: '',
  },
  {
    name: 'netWeight',
    label: 'Net Weight',
    required: false,
    type: 'text',
    placeholder: 'e.g., 3.5',
    defaultValue: '',
  },
  {
    name: 'netWeightUnit',
    label: 'Net Weight Unit',
    required: false,
    type: 'text',
    placeholder: 'e.g., g, oz, ml',
    defaultValue: '',
  },
  {
    name: 'packagingMode',
    label: 'Packaging Mode',
    required: false,
    type: 'select',
    options: [
      {value: 'bulk', label: 'Bulk'},
      {value: 'prepack', label: 'Prepack'},
    ],
    defaultValue: undefined,
  },
  {
    name: 'stockUnit',
    label: 'Stock Unit',
    required: false,
    type: 'text',
    placeholder: 'e.g., g, oz, lb',
    defaultValue: '',
  },
  {
    name: 'packSize',
    label: 'Pack Size',
    required: false,
    type: 'text',
    placeholder: '10',
    defaultValue: '',
  },
  {
    name: 'startingWeight',
    label: 'Starting Weight',
    required: false,
    type: 'text',
    placeholder: 'Initial bulk weight',
    defaultValue: '',
  },
  {
    name: 'remainingWeight',
    label: 'Remaining Weight',
    required: false,
    type: 'text',
    placeholder: 'Current remaining bulk weight',
    defaultValue: '',
  },
]

export const defaultValues: ProductFormValues = {
  ...productFields.reduce(
    (acc, field) => {
      const key = field.name as keyof ProductFormValues
      ;(acc as Record<string, unknown>)[key] = field.defaultValue
      return acc
    },
    {} as Record<string, unknown>,
  ),
  stockByDenomination: {},
  priceByDenomination: {},
  inventoryMode: 'by_denomination',
  masterStockQuantity: undefined,
  masterStockUnit: '',
  popularDenomination: [] as number[],
  tier: undefined,
  lineage: undefined,
  productType: undefined,
  brand: [] as string[],
  noseRating: undefined,
  onSale: false,
  eligibleForUpgrade: false,
  upgradePrice: undefined,
  packagingMode: undefined,
  stockUnit: '',
  packSize: '',
  startingWeight: '',
  remainingWeight: '',
} as ProductFormValues

export const flowerDenominations: Array<SelectOption> = [
  {value: '1/8', label: '1/8'},
  {value: '1/4', label: '1/4'},
  {value: '1/2', label: '1/2'},
  {value: '1', label: '1'},
  {value: '2', label: '2'},
  {value: '4', label: '4'},
  {value: 'Custom', label: 'custom'},
]

export const mapFractions: Record<string, string> = {
  '0.125oz': '⅛ oz',
  '0.25oz': '¼ oz',
  '0.5oz': '½ oz',
  '1oz': '1 oz',
  '2oz': '2 oz',
  '4oz': '4 oz',
  '8oz': '8 oz',
}

export const mapNumericFractions: Record<string, string> = {
  0.125: '⅛',
  0.25: '¼',
  0.5: '½',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
}

export const mapNumericGrams: Record<string, string> = {
  0.125: '3.5',
  0.25: '7',
  0.5: '14',
  1: '28',
  2: '',
  3: '',
  4: '',
  5: '',
  6: '',
  7: '',
  8: '',
  9: '',
  10: '',
}
