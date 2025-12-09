import {extendVariants, SelectItem} from '@heroui/react'

/**
 * Category color type - represents all available category color variants
 */
export type CategoryColor =
  | 'default'
  | 'flower'
  | 'extracts'
  | 'edibles'
  | 'concentrates'
  | 'vapes'
  | 'accessories'

/**
 * Shared color configuration for categories.
 * This is the single source of truth for category colors used across
 * CategorySelectItem and Chip components.
 */
export const categoryColors = {
  default: {
    textColor: 'text-foreground',
    chipColor: 'default' as const,
    chipClassName: ' border',
  },
  flower: {
    textColor: 'text-green-600 dark:text-green-400',
    chipColor: 'success' as const,
    chipClassName:
      'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-300 border border-light-gray dark:border-light-gray/50',
  },
  extracts: {
    textColor: 'text-rose-600 dark:text-rose-400',
    chipColor: 'danger',
    chipClassName:
      'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 border border-light-gray dark:border-light-gray/50',
  },
  edibles: {
    textColor: 'text-orange-600 dark:text-orange-300',
    chipColor: 'warning' as const,
    chipClassName:
      'bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-300 border border-light-gray dark:border-light-gray/50',
  },
  concentrates: {
    textColor: 'text-purple-600 dark:text-purple-400',
    chipColor: 'secondary' as const,
    chipClassName:
      'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 border border-light-gray dark:border-light-gray/50',
  },
  vapes: {
    textColor: 'text-blue-600 dark:text-blue-400',
    chipColor: 'primary' as const,
    chipClassName:
      'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 border border-light-gray dark:border-light-gray/50',
  },
  accessories: {
    textColor: 'text-gray-600 dark:text-gray-400',
    chipColor: 'default' as const,
    chipClassName:
      'bg-gray-100 text-gray-700 dark:bg-gray-950/20 dark:text-gray-300 border border-light-gray dark:border-light-gray/50',
  },
} as const

/**
 * Maps category slug/value to a color variant name.
 *
 * @param categoryValue - The category slug or value
 * @returns The color variant name to use for the category
 */
export function getCategoryColor(categoryValue: string): CategoryColor {
  const normalized = categoryValue.toLowerCase()

  if (normalized.includes('flower') || normalized.includes('bud')) {
    return 'flower'
  }
  if (normalized.includes('extract')) {
    return 'extracts'
  }
  if (normalized.includes('edible')) {
    return 'edibles'
  }
  if (normalized.includes('concentrate')) {
    return 'concentrates'
  }
  if (normalized.includes('vape') || normalized.includes('cartridge')) {
    return 'vapes'
  }
  if (normalized.includes('accessory') || normalized.includes('gear')) {
    return 'accessories'
  }

  return 'default'
}

/**
 * Gets the Chip color configuration for a category.
 *
 * @param categoryValue - The category slug or value
 * @returns Object with chipColor and chipClassName for the Chip component
 */
export function getCategoryChipProps(categoryValue: string) {
  const categoryColor = getCategoryColor(categoryValue)
  const colorConfig = categoryColors[categoryColor]

  return {
    color: colorConfig.chipColor,
    className: colorConfig.chipClassName,
  }
}

/**
 * Extended SelectItem variant specifically designed for product categories.
 *
 * This component extends the base SelectItem with custom styling and variants
 * optimized for category selection in product forms.
 *
 * @example
 * ```tsx
 * <CategorySelectItem key="flower" value="flower" color="flower">
 *   Flower
 * </CategorySelectItem>
 * ```
 */
export const CategorySelectItem = extendVariants(SelectItem, {
  variants: {
    color: {
      default: {
        base: categoryColors.default.textColor,
      },
      flower: {
        base: categoryColors.flower.textColor,
      },
      extracts: {
        base: categoryColors.extracts.textColor,
      },
      edibles: {
        base: categoryColors.edibles.textColor,
      },
      concentrates: {
        base: categoryColors.concentrates.textColor,
      },
      vapes: {
        base: categoryColors.vapes.textColor,
      },
      accessories: {
        base: categoryColors.accessories.textColor,
      },
    },
    size: {
      sm: {
        base: 'text-sm',
      },
      md: {
        base: 'text-base',
      },
      lg: {
        base: 'text-lg',
      },
    },
  },
  defaultVariants: {
    color: 'default',
    size: 'md',
    variant: 'faded',
  },
  compoundVariants: [
    {
      color: 'flower',
      variant: 'faded',
      class: 'hover:bg-green-50 dark:hover:bg-green-950/20',
    },
    {
      color: 'extracts',
      variant: 'faded',
      class: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/20',
    },
    {
      color: 'edibles',
      variant: 'faded',
      class: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
    },
    {
      color: 'concentrates',
      variant: 'faded',
      class: 'hover:bg-purple-50 dark:hover:bg-purple-950/20',
    },
    {
      color: 'vapes',
      variant: 'faded',
      class: 'hover:bg-blue-50 dark:hover:bg-blue-950/20',
    },
  ],
})
