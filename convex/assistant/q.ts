import {v} from 'convex/values'
import {parseAssistantConfig} from '../../lib/assistant/config'
import {query} from '../_generated/server'
import type {Doc, Id} from '../_generated/dataModel'
import {ASSISTANT_PRO_ID} from './d'

function compareCategoriesByOrderThenName(
  a: {name: string; order?: number},
  b: {name: string; order?: number},
): number {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB
  return a.name.localeCompare(b.name)
}

function compareProductsByName(
  a: {featured?: boolean; name?: string},
  b: {featured?: boolean; name?: string},
): number {
  const aFeatured = a.featured ?? false
  const bFeatured = b.featured ?? false

  if (aFeatured !== bFeatured) {
    return aFeatured ? -1 : 1
  }

  return (a.name ?? '').localeCompare(b.name ?? '')
}

function resolveTierLabel(
  tier: string | undefined,
  category: Doc<'categories'> | null | undefined,
): string | undefined {
  const normalizedTier = tier?.trim()
  if (!normalizedTier) return undefined

  const match = category?.tiers?.find(
    (entry) => entry.slug === normalizedTier || entry.name === normalizedTier,
  )

  return match?.name ?? normalizedTier
}

function normalizeBrands(brands: string[] | undefined): string[] {
  return (brands ?? [])
    .map((brand) => brand.trim())
    .filter((brand) => brand.length > 0)
}

/**
 * Get all messages between the user and the assistant
 */
export const getAssistantMessages = query({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user and assistant in parallel
    const [user, assistant] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', args.fid))
        .first(),
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
        .first(),
    ])

    if (!user || !assistant) {
      return []
    }

    // Get messages sent by user to assistant and from assistant to user in parallel
    const [sentMessages, receivedMessages] = await Promise.all([
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', user._id).eq('receiverId', assistant._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', assistant._id).eq('receiverId', user._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
    ])

    // Combine and sort by creation time
    const allMessages = [...sentMessages, ...receivedMessages]
    allMessages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    // Transform to a simpler format with role
    return allMessages.map((msg) => ({
      id: msg._id,
      role:
        msg.senderId === assistant._id
          ? ('assistant' as const)
          : ('user' as const),
      content: msg.content,
      createdAt: msg.createdAt,
    }))
  },
})

/**
 * Get the assistant user for display purposes
 */
export const getAssistantUser = query({
  args: {},
  handler: async (ctx) => {
    const assistant = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    return assistant
  },
})

/**
 * Get the assistant's profile including isPublic and bio fields
 */
export const getAssistantProfile = query({
  args: {},
  handler: async (ctx) => {
    const assistant = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
      .first()

    return assistant
  },
})

export const getAssistantRuntimeConfig = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('adminSettings')
      .withIndex('by_identifier', (q) => q.eq('identifier', 'ai_assistant_config'))
      .unique()

    const config = parseAssistantConfig(settings?.value)

    return {
      isActive: config.isActive,
      catalogSupportEnabled: config.catalogSupportEnabled,
    }
  },
})

export const getAssistantCatalog = query({
  args: {},
  handler: async (ctx) => {
    const [categories, products] = await Promise.all([
      ctx.db
        .query('categories')
        .filter((q) => q.neq(q.field('visible'), false))
        .collect(),
      ctx.db.query('products').collect(),
    ])

    const visibleCategories = [...categories].sort(compareCategoriesByOrderThenName)
    const categoryBySlug = new Map(
      visibleCategories
        .filter((category) => typeof category.slug === 'string' && category.slug)
        .map((category) => [category.slug as string, category]),
    )

    const visibleProducts = products
      .filter(
        (product) =>
          product.archived !== true &&
          typeof product.slug === 'string' &&
          product.slug.length > 0 &&
          typeof product.name === 'string' &&
          product.name.length > 0,
      )
      .sort(compareProductsByName)

    return {
      categories: visibleCategories
        .filter((category) => typeof category.slug === 'string' && category.slug)
        .map((category) => ({
          name: category.name,
          slug: category.slug as string,
          href: `/lobby/category/${category.slug as string}`,
          description: category.description,
          tiers: category.tiers ?? [],
          subcategories: category.subcategories ?? [],
          brands: category.brands ?? [],
        })),
      products: visibleProducts.map((product) => {
        const category = categoryBySlug.get(product.categorySlug ?? '')

        return {
          name: product.name as string,
          slug: product.slug as string,
          href: `/lobby/products/${product.slug as string}`,
          categorySlug: product.categorySlug ?? '',
          categoryName: category?.name,
          brand: normalizeBrands(product.brand),
          tier: product.tier,
          tierLabel: resolveTierLabel(product.tier, category),
          subcategory: product.subcategory,
          productType: product.productType,
          strainType: product.strainType,
          available: product.available !== false,
          featured: product.featured === true,
        }
      }),
    }
  },
})

/**
 * Get the last message with the assistant for preview
 */
export const getLastAssistantMessage = query({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user and assistant in parallel
    const [user, assistant] = await Promise.all([
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', args.fid))
        .first(),
      ctx.db
        .query('users')
        .withIndex('by_fid', (q) => q.eq('fid', ASSISTANT_PRO_ID))
        .first(),
    ])

    if (!user || !assistant) {
      return null
    }

    // Get all messages between user and assistant in parallel
    const [sentMessages, receivedMessages] = await Promise.all([
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', user._id).eq('receiverId', assistant._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
      ctx.db
        .query('messages')
        .withIndex('by_sender_receiver', (q) =>
          q.eq('senderId', assistant._id).eq('receiverId', user._id),
        )
        .filter((q) => q.eq(q.field('visible'), true))
        .collect(),
    ])

    // Get the most recent message
    const allMessages = [...sentMessages, ...receivedMessages]
    if (allMessages.length === 0) {
      return null
    }

    allMessages.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    const lastMessage = allMessages[0]
    return {
      content: lastMessage.content,
      createdAt: lastMessage.createdAt,
      isFromAssistant: lastMessage.senderId === assistant._id,
    }
  },
})

/**
 * Get a pre-built slug → thumbnail URL index for the product thumbnail tool.
 * Storage IDs are resolved to signed URLs at query time.
 */
export const getProductThumbnails = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('products').collect()

    const resolved = await Promise.all(
      products
        .filter(
          (p) =>
            p.archived !== true &&
            typeof p.slug === 'string' &&
            p.slug.length > 0 &&
            typeof p.name === 'string' &&
            p.name.length > 0 &&
            p.image != null,
        )
        .map(async (p) => {
          const raw = p.image as string
          let imageUrl: string | null = null

          if (
            raw.startsWith('http://') ||
            raw.startsWith('https://') ||
            raw.startsWith('/')
          ) {
            imageUrl = raw
          } else {
            try {
              imageUrl = await ctx.storage.getUrl(raw as Id<'_storage'>)
            } catch {
              imageUrl = null
            }
          }

          if (!imageUrl) return null

          return {
            slug: p.slug as string,
            name: p.name as string,
            imageUrl,
          }
        }),
    )

    return resolved.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})
