import {FormInput, SelectOption} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {z} from 'zod'

export const flowerProductTiers = [
  'B',
  'A',
  'AA',
  'AAA',
  'AAAA',
  'RARE',
] as const

export const extractProductTiers = [
  'Cured Resin',
  'Fresh Frozen',
  'Live Resin',
  'Full Melt',
  'Half Melt',
] as const

export const vapeProductTiers = [
  'Distillate',
  'Live Resin',
  'Cured Resin',
  'Liquid Diamonds',
  'Sauce',
  'Live Rosin',
  'Cured Rosin',
] as const

export const allProductTiers = [
  ...flowerProductTiers,
  ...extractProductTiers,
  'Distillate',
  'Liquid Diamonds',
  'Sauce',
  'Live Rosin',
  'Cured Rosin',
] as const

export const extractAndEdibleProductBases = [
  'Distillate',
  'Hydrocarbon (BHO)',
  'CO2',
  'Rosin',
  'Hash',
] as const

export const preRollProductBases = ['Flower', 'Infused'] as const

const categoryContains = (
  categorySlug: string,
  candidates: readonly string[],
) => candidates.some((candidate) => categorySlug.includes(candidate))

export const getProductTierValuesByCategory = (categorySlug?: string) => {
  const normalized = categorySlug?.toLowerCase().trim() ?? ''

  if (categoryContains(normalized, ['extract', 'concentrate'])) {
    return extractProductTiers
  }

  if (categoryContains(normalized, ['vape', 'cart', 'cartridge'])) {
    return vapeProductTiers
  }

  return flowerProductTiers
}

export const getProductTierOptionsByCategory = (
  categorySlug?: string,
): SelectOption[] =>
  getProductTierValuesByCategory(categorySlug).map((tier) => ({
    value: tier,
    label: tier,
  }))

export const getProductBaseValuesByCategory = (
  categorySlug?: string,
): readonly string[] => {
  const normalized = categorySlug?.toLowerCase().trim() ?? ''

  if (categoryContains(normalized, ['extract', 'concentrate', 'edible'])) {
    return extractAndEdibleProductBases
  }

  if (categoryContains(normalized, ['pre-roll', 'preroll', 'pre roll'])) {
    return preRollProductBases
  }

  return []
}

export const getProductBaseOptionsByCategory = (
  categorySlug?: string,
): SelectOption[] =>
  getProductBaseValuesByCategory(categorySlug).map((base) => ({
    value: base,
    label: base,
  }))

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  base: z.string().optional(),
  categorySlug: z.string().min(1, 'Select a category.'),
  brand: z.string().optional(),
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
  stock: z.optional(z.number().min(0, 'Stock must be positive.')),
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
  noseRating: z
    .number()
    .min(0, 'Nose rating must be 0 or more.')
    .max(10, 'Nose rating must be 10 or less.')
    .optional(),
  weightGrams: z.string().optional(),
  netWeight: z.string().optional(),
  netWeightUnit: z.string().optional(),
  batchId: z.string().optional(),
  variants: z
    .array(
      z.object({
        label: z.string(),
        price: z.number(),
      }),
    )
    .optional(),
  tier: z.enum(allProductTiers).optional(),
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
    name: 'subcategory',
    label: 'Subcategory',
    required: false,
    type: 'text',
    placeholder: 'Cartridge, Disposable, Pod',
    defaultValue: '',
  },
  {
    name: 'productType',
    label: 'Product Type',
    required: false,
    type: 'select',
    options: [],
    placeholder: 'Product type',
    defaultValue: '',
  },
  {
    name: 'brand',
    label: 'Brand',
    required: false,
    type: 'text',
    placeholder: 'Brand name',
    defaultValue: '',
  },
  {
    name: 'tier',
    label: 'Tier',
    required: false,
    type: 'select',
    options: allProductTiers.map((tier) => ({value: tier, label: tier})),
    placeholder: 'Select tier',
    defaultValue: '',
  },
  {
    name: 'batchId',
    label: 'Batch ID',
    required: false,
    type: 'text',
    placeholder: 'e.g., B-2026-0007',
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
  popularDenomination: [] as number[],
  tier: undefined,
  lineage: undefined,
  productType: undefined,
  noseRating: undefined,
  onSale: false,
  eligibleForUpgrade: false,
  upgradePrice: undefined,
} as ProductFormValues

export const flowerDenominations: Array<SelectOption> = [
  {value: '1/8', label: '1/8'},
  {value: '1/4', label: '1/4'},
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
}

export const productTiers = allProductTiers
