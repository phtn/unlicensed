import {Infer, v} from 'convex/values'
import {recipientSchema} from '../mailingLists/d'

export const emailBlastStatusSchema = v.union(
  v.literal('queued'),
  v.literal('sending'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('cancelled'),
)

export const emailBlastSchema = v.object({
  emailSettingId: v.union(v.id('emailSettings'), v.null()),
  mailingListId: v.id('mailingLists'),
  mailingListName: v.string(),
  templateTitle: v.string(),
  subject: v.string(),
  template: v.optional(v.string()),
  templateProps: v.optional(v.string()),
  html: v.optional(v.string()),
  body: v.optional(v.string()),
  cc: v.optional(v.array(v.string())),
  bcc: v.optional(v.array(v.string())),
  recipients: v.array(recipientSchema),
  totalRecipients: v.number(),
  processedRecipients: v.number(),
  sentRecipients: v.number(),
  failedRecipients: v.number(),
  nextRecipientIndex: v.number(),
  processingRecipientIndex: v.optional(v.number()),
  currentRecipientEmail: v.optional(v.string()),
  lastProviderMessageId: v.optional(v.string()),
  lastError: v.optional(v.string()),
  stopOnError: v.boolean(),
  status: emailBlastStatusSchema,
  initiatedByUid: v.string(),
  initiatedByEmail: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  startedAt: v.number(),
  finishedAt: v.optional(v.number()),
})

export type EmailBlast = Infer<typeof emailBlastSchema>
export type EmailBlastStatus = Infer<typeof emailBlastStatusSchema>
