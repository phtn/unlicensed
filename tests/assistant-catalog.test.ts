import {describe, expect, test} from 'bun:test'
import {
  buildAssistantCatalogPrompt,
  createAssistantCatalogLinkIndex,
  linkifyAssistantText,
  type AssistantCatalog,
} from '@/lib/assistant/catalog'
import {
  DEFAULT_ASSISTANT_INSTRUCTIONS,
  parseAssistantConfig,
} from '@/lib/assistant/config'

const catalog: AssistantCatalog = {
  categories: [
    {
      name: 'Flower',
      slug: 'flower',
      href: '/lobby/category/flower',
      tiers: [{name: 'AAAA', slug: 'aaaa'}],
      subcategories: [{name: 'Regular', slug: 'regular'}],
      brands: [{name: 'Jungle Boys', slug: 'jungle-boys'}],
    },
  ],
  products: [
    {
      name: 'Blue Dream',
      slug: 'blue-dream',
      href: '/lobby/products/blue-dream',
      categorySlug: 'flower',
      categoryName: 'Flower',
      brand: ['Jungle Boys'],
      tier: 'aaaa',
      tierLabel: 'AAAA',
      subcategory: 'Regular',
      available: true,
      featured: true,
    },
  ],
}

describe('assistant catalog helpers', () => {
  test('linkifies category and product mentions', () => {
    const linkIndex = createAssistantCatalogLinkIndex(catalog)
    const segments = linkifyAssistantText(
      'Browse Flower or Blue Dream today.',
      linkIndex,
    )

    expect(segments.filter((segment) => segment.type === 'link')).toEqual([
      {
        type: 'link',
        text: 'Flower',
        href: '/lobby/category/flower',
        kind: 'category',
      },
      {
        type: 'link',
        text: 'Blue Dream',
        href: '/lobby/products/blue-dream',
        kind: 'product',
      },
    ])
  })

  test('supports pluralized category mentions', () => {
    const linkIndex = createAssistantCatalogLinkIndex(catalog)
    const segments = linkifyAssistantText('We have fresh flowers.', linkIndex)
    const links = segments.filter((segment) => segment.type === 'link')

    expect(links).toEqual([
      {
        type: 'link',
        text: 'flowers',
        href: '/lobby/category/flower',
        kind: 'category',
      },
    ])
  })

  test('builds runtime catalog context with relevant products', () => {
    const prompt = buildAssistantCatalogPrompt(
      catalog,
      'Do you have Blue Dream flower right now?',
    )

    expect(prompt).toContain('## Runtime Catalog Context')
    expect(prompt).toContain('/lobby/category/flower')
    expect(prompt).toContain('/lobby/products/blue-dream')
    expect(prompt).toContain('Blue Dream')
  })
})

describe('assistant config parsing', () => {
  test('falls back to defaults when config is missing', () => {
    expect(parseAssistantConfig(undefined)).toEqual({
      instructions: DEFAULT_ASSISTANT_INSTRUCTIONS,
      isActive: true,
      catalogSupportEnabled: true,
    })
  })

  test('keeps explicit runtime flags and instructions', () => {
    expect(
      parseAssistantConfig({
        instructions: 'Custom prompt',
        isActive: false,
        catalogSupportEnabled: false,
      }),
    ).toEqual({
      instructions: 'Custom prompt',
      isActive: false,
      catalogSupportEnabled: false,
    })
  })
})
