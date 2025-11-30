import {Infer, v} from 'convex/values'
import {mutation} from '../_generated/server'

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    flags: v.optional(v.array(v.string())),
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('archived'),
    ),
    authorId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const blogId = await ctx.db.insert('blogs', {
      ...args,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === 'published' ? now : undefined,
    })
    return blogId
  },
})

const patchSchema = v.object({
  title: v.optional(v.string()),
  slug: v.optional(v.string()),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  flags: v.optional(v.array(v.string())),
  status: v.optional(
    v.union(v.literal('draft'), v.literal('published'), v.literal('archived')),
  ),
  authorId: v.optional(v.id('users')),
})

export const patchDates = v.object({
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  publishedAt: v.optional(v.number()),
})

type PatchBlogArgs = Infer<typeof patchSchema>
type PatchDatesArgs = Infer<typeof patchDates>

export const update = mutation({
  args: {
    id: v.id('blogs'),
    patch: patchSchema,
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error('Blog post not found')

    const updates: PatchBlogArgs & PatchDatesArgs = {
      ...args.patch,
      updatedAt: now,
    }

    if (args.patch.status === 'published' && existing.status !== 'published') {
      updates.publishedAt = now
    }

    await ctx.db.patch(args.id, updates)
  },
})

export const remove = mutation({
  args: {id: v.id('blogs')},
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
