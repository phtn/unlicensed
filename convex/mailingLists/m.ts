import {mutation} from '../_generated/server'
import {v} from 'convex/values'
import {recipientSchema} from './d'

const normalizeRecipients = (
  recipients: Array<{
    name: string
    email: string
  }>,
) =>
  recipients
    .map((recipient) => ({
      name: recipient.name.trim(),
      email: recipient.email.trim(),
    }))
    .filter((recipient) => recipient.email.length > 0)

export const create = mutation({
  args: {
    name: v.string(),
    recipients: v.array(recipientSchema),
  },
  handler: async (ctx, args) => {
    const valid = normalizeRecipients(args.recipients)
    if (valid.length === 0) {
      throw new Error('At least one recipient with an email is required')
    }
    const now = Date.now()
    return await ctx.db.insert('mailingLists', {
      name: args.name || 'Untitled',
      recipients: valid,
      createdAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('mailingLists'),
    name: v.string(),
    recipients: v.array(recipientSchema),
  },
  handler: async (ctx, args) => {
    const valid = normalizeRecipients(args.recipients)
    if (valid.length === 0) {
      throw new Error('At least one recipient with an email is required')
    }

    await ctx.db.patch(args.id, {
      name: args.name || 'Untitled',
      recipients: valid,
    })

    return args.id
  },
})

export const remove = mutation({
  args: {
    id: v.id('mailingLists'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id)

    if (!existing) {
      throw new Error('Mailing list not found')
    }

    await ctx.db.delete(args.id)

    return args.id
  },
})
