import {z} from 'zod'

export const resendAttachmentSchema = z.object({
  filename: z.string().min(1),
  contentBase64: z.string().min(1),
})

export const resendRequestSchema = z.object({
  action: z.enum(['send', 'receive']).optional().default('send'),
  intent: z.enum(['activation', 'marketing', 'sales', 'invite', 'notice']),
  type: z.enum(['insurance', 'products']),
  group: z.enum(['pa', 'auto']),
  subject: z.string().min(1),
  text: z.string().optional(),
  bcc: z.array(z.string().min(1)).optional(),
  cc: z.array(z.string().min(1)).optional(),
  to: z.union([z.array(z.string().min(1)), z.string().min(1)]),
  from: z.string().min(1).optional(),
  body: z.string().optional(),
  attachments: z.array(resendAttachmentSchema).optional(),
  html: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
})

export type ResendRequest = z.infer<typeof resendRequestSchema>

export const resendApiSuccessResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string().min(1).nullable(),
})

export const resendApiErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string().min(1),
})

export const resendApiResponseSchema = z.union([
  resendApiSuccessResponseSchema,
  resendApiErrorResponseSchema,
])

export type ResendApiResponse = z.infer<typeof resendApiResponseSchema>
