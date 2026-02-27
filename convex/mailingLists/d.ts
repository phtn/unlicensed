import {Infer, v} from 'convex/values'

export const recipientSchema = v.object({
  name: v.string(),
  email: v.string(),
})

export const mailingListSchema = v.object({
  name: v.string(),
  recipients: v.array(recipientSchema),
  createdAt: v.number(),
})

export type MailingList = Infer<typeof mailingListSchema>
export type Recipient = Infer<typeof recipientSchema>
