import { ReactFormExtendedApi } from '@tanstack/react-form'
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  categorySlug: z.string().min(1, 'Select a category.'),
  shortDescription: z.string().min(10, 'Short description is required.'),
  description: z.string().min(20, 'Description is required.'),
  priceCents: z.number().min(0, 'Price must be positive.'),
  unit: z.string().min(1, 'Unit is required.'),
  availableDenominationsRaw: z.string().optional(),
  popularDenomination: z.string().optional(),
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
  stock: z.number().min(0, 'Stock must be positive.'),
  rating: z
    .number()
    .min(0, 'Rating must be at least 0.')
    .max(5, 'Rating must be 5 or less.'),
  image: z
    .string()
    .min(1, 'Upload a primary image or provide a URL/storage ID.'),
  gallery: z.array(z.string()),
  consumption: z.string().min(5, 'Consumption guidance is required.'),
  potencyLevel: z.enum(['mild', 'medium', 'high']),
  potencyProfile: z.string().optional(),
  weightGrams: z.string().optional(),
  variants: z
    .array(
      z.object({
        label: z.string(),
        price: z.number(),
      }),
    )
    .optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>

// Define the Form API type with any for validators to match inferred types
// using any here is necessary because strict undefined doesn't match inferred method signatures
export type ProductFormApi = ReactFormExtendedApi<
  ProductFormValues,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>
