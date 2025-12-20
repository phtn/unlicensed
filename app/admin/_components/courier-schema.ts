import {z} from 'zod'
import {FormInput} from './ui/fields'
import {useAppForm} from './ui/form-context'

export const courierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  code: z.string().min(1, 'Code is required.'),
  active: z.boolean().default(true),
  trackingUrlTemplate: z.string().optional(),
})

export type CourierFormValues = z.infer<typeof courierSchema>

// Form API type - simplified for TanStack Form composition
export type CourierFormApi = ReturnType<typeof useAppForm>

export const courierFields: FormInput<CourierFormValues>[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    required: true,
    placeholder: 'Courier Name (e.g., FedEx, UPS)',
    defaultValue: '',
  },
  {
    name: 'code',
    type: 'text',
    label: 'Code',
    required: true,
    placeholder: 'Unique code (e.g., fedex, ups)',
    defaultValue: '',
  },
  {
    name: 'active',
    label: 'Active',
    required: false,
    type: 'checkbox',
    placeholder: 'Toggle active status',
    defaultValue: true,
  },
  {
    name: 'trackingUrlTemplate',
    label: 'Tracking URL Template',
    required: false,
    type: 'text',
    placeholder: 'e.g., https://tracking.com/{trackingNumber}',
    defaultValue: '',
  },
]

export const defaultValues = courierFields
  .map((f) => ({
    [f.name]: f.defaultValue,
  }))
  .reduce((acc, obj) => ({...acc, ...obj}), {}) as CourierFormValues

