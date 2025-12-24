import {mutation} from '../_generated/server'
import {v} from 'convex/values'
import {emailSettingsSchema} from './d'

export const create = mutation({
  args: emailSettingsSchema.fields,
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('emailSettings', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('emailSettings'),
    intent: v.optional(v.string()),
    visible: v.optional(v.boolean()),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    from: v.optional(v.array(v.string())),
    to: v.optional(v.array(v.string())),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.optional(v.string()),
    text: v.optional(v.string()),
    body: v.optional(v.string()),
    group: v.optional(v.string()),
    headers: v.optional(v.record(v.string(), v.string())),
    html: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {id, ...data} = args
    await ctx.db.patch(id, {
      ...data,
      updatedAt: Date.now(),
    })
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id('emailSettings'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})

