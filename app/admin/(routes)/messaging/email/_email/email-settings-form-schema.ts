import z from 'zod'

const mustachePlaceholderRegex = /^\s*\{\{[^}]+\}\}\s*$/

const isValidRecipientToken = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (mustachePlaceholderRegex.test(trimmed)) return true
  return z.email().safeParse(trimmed).success
}

export const parseRecipientList = (value: string): string[] => {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

export const emailSettingsFormSchema = z.object({
  title: z.string().trim().min(1, 'Template name is required'),
  intent: z.string().trim(),
  visible: z.boolean(),
  type: z.string().trim().min(1, 'Type is required'),
  group: z.string().trim(),

  from: z
    .string()
    .refine(
      (value) => parseRecipientList(value).every(isValidRecipientToken),
      'One or more sender values are invalid',
    ),
  to: z
    .string()
    .refine(
      (value) => parseRecipientList(value).every(isValidRecipientToken),
      'One or more recipient values are invalid',
    ),
  cc: z
    .string()
    .refine(
      (value) => parseRecipientList(value).every(isValidRecipientToken),
      'One or more CC values are invalid',
    ),
  bcc: z
    .string()
    .refine(
      (value) => parseRecipientList(value).every(isValidRecipientToken),
      'One or more BCC values are invalid',
    ),

  subject: z.string().trim().min(1, 'Subject is required'),
  text: z.string(),
  body: z.string(),
  html: z.string(),
})

export type EmailSettingsFormValues = z.infer<typeof emailSettingsFormSchema>

const emptyToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : undefined
}

export type EmailSettingsConvexArgs = {
  title: string
  intent?: string
  visible: boolean
  type: string
  group?: string
  from?: string[]
  to?: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  text?: string
  body?: string
  html?: string
}

export const toEmailSettingsConvexArgs = (
  values: EmailSettingsFormValues,
): EmailSettingsConvexArgs => {
  const fromList = parseRecipientList(values.from)
  const toList = parseRecipientList(values.to)
  const ccList = parseRecipientList(values.cc)
  const bccList = parseRecipientList(values.bcc)

  return {
    title: values.title.trim(),
    intent: emptyToUndefined(values.intent),
    visible: values.visible,
    type: values.type.trim(),
    group: emptyToUndefined(values.group),
    from: fromList.length ? fromList : undefined,
    to: toList.length ? toList : undefined,
    cc: ccList.length ? ccList : undefined,
    bcc: bccList.length ? bccList : undefined,
    subject: values.subject.trim(),
    text: emptyToUndefined(values.text),
    body: emptyToUndefined(values.body),
    html: emptyToUndefined(values.html),
  }
}
