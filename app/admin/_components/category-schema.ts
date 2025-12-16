import {z} from 'zod'
import {FormInput} from './ui/fields'
import {useAppForm} from './ui/form-context'

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  description: z.string().min(10, 'Description is required.'),
  heroImage: z
    .string()
    .min(1, 'Please upload a hero image or provide an image URL/storage ID.'),
  highlight: z.string().optional(),
  benefitsRaw: z.string().optional(),
  unitsRaw: z.string().optional(),
  denominationsRaw: z.string().optional(),
  visible: z.boolean().default(false),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// Form API type - simplified for TanStack Form composition
export type CategoryFormApi = ReturnType<typeof useAppForm>

const parseList = (value?: string) =>
  (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const parseNumbers = (value?: string): number[] | undefined => {
  if (!value) return undefined
  const numbers = value
    .split(/[,\n]/)
    .map((item) => {
      const trimmed = item.trim()
      const num = Number.parseFloat(trimmed)
      return Number.isNaN(num) ? null : num
    })
    .filter((num): num is number => num !== null)
  return numbers.length > 0 ? numbers : undefined
}

export {parseList, parseNumbers}

export const categoryFields: FormInput<CategoryFormValues>[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    placeholder: 'Category Name',
    defaultValue: '',
  },
  {
    name: 'slug',
    type: 'text',
    label: 'Slug',
    required: false,
    placeholder: 'designer-flower (auto-generated if empty)',
    defaultValue: '',
  },
  {
    name: 'visible',
    label: 'Active',
    required: false,
    type: 'checkbox',
    placeholder: 'Toggle visibility',
    defaultValue: true,
  },
  {
    name: 'description',
    label: 'Description',
    required: true,
    type: 'textarea',
    placeholder: 'Describe the category experience...',
    defaultValue: '',
  },
  {
    name: 'heroImage',
    label: 'Hero Image',
    required: true,
    type: 'text',
    placeholder: 'Image URL or storage ID',
    defaultValue: '',
  },
  {
    name: 'highlight',
    label: 'Highlight',
    required: false,
    type: 'text',
    placeholder: 'Hand-trimmed buds with rich terpene expression.',
    defaultValue: '',
  },
  {
    name: 'benefitsRaw',
    label: 'Benefits',
    required: false,
    type: 'textarea',
    placeholder: 'Enter one benefit per line\ne.g.\nFull-spectrum cannabinoids',
    defaultValue: '',
  },
  {
    name: 'unitsRaw',
    label: 'Units',
    required: false,
    type: 'text',
    placeholder: 'e.g., g, oz, ml, kg, lb, each',
    defaultValue: '',
  },
  {
    name: 'denominationsRaw',
    label: 'Denominations',
    required: false,
    type: 'textarea',
    placeholder:
      'Enter denominations separated by commas or newlines\ne.g.\n1, 3.5, 7, 14, 28',
    defaultValue: '',
  },
]

export const defaultValues = categoryFields
  .map((f) => ({
    [f.name]: f.defaultValue,
  }))
  .reduce((acc, obj) => ({...acc, ...obj}), {}) as CategoryFormValues
