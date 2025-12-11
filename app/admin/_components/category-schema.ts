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
})

export type CategoryFormValues = z.infer<typeof categorySchema>

// Form API type - simplified for TanStack Form composition
export type CategoryFormApi = ReturnType<typeof useAppForm>

const parseList = (value?: string) =>
  (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

export {parseList}

export const categoryFields: FormInput<CategoryFormValues>[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    placeholder: 'Premium Flower',
    defaultValue: '',
  },
  {
    name: 'slug',
    type: 'text',
    label: 'Slug',
    required: false,
    placeholder: 'premium-flower (auto-generated if empty)',
    defaultValue: '',
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
]

export const defaultValues = categoryFields
  .map((f) => ({
    [f.name]: f.defaultValue,
  }))
  .reduce((acc, obj) => ({...acc, ...obj}), {}) as CategoryFormValues
