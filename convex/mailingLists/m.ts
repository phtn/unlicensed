import {mutation} from '../_generated/server'
import {v} from 'convex/values'
import {recipientSchema} from './d'

export const create = mutation({
  args: {
    name: v.string(),
    recipients: v.array(recipientSchema),
  },
  handler: async (ctx, args) => {
    const valid = args.recipients.filter((r) => r.email.trim().length > 0)
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
