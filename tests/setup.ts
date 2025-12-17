/**
 * Test Setup Utilities
 *
 * Helper functions for setting up test data and cleaning up after tests.
 */

import {ConvexHttpClient} from 'convex/browser'
import fs from 'fs'
import path from 'path'
import {api} from '../convex/_generated/api'
import type {Id} from '../convex/_generated/dataModel'

export interface TestData {
  userId: Id<'users'>
  categoryId: Id<'categories'>
  productId: Id<'products'>
  categorySlug: string
}

/**
 * Create test user
 */
export async function createTestUser(
  client: ConvexHttpClient,
  suffix: string = Date.now().toString(),
): Promise<Id<'users'>> {
  return await client.mutation(api.users.m.createOrUpdateUser, {
    email: `test-${suffix}@example.com`,
    name: 'Test User',
    firebaseId: `test-firebase-${suffix}`,
  })
}

/**
 * Create test category
 */
export async function createTestCategory(
  client: ConvexHttpClient,
  suffix: string = Date.now().toString(),
): Promise<{categoryId: Id<'categories'>; categorySlug: string}> {
  const categorySlug = `test-category-${suffix}`
  const categoryId = await client.mutation(api.categories.m.create, {
    name: 'Test Category',
    description: 'Test category description',
    heroImage: undefined,
    slug: categorySlug,
  })

  return {categoryId, categorySlug}
}

/**
 * Create test product
 */
export async function createTestProduct(
  client: ConvexHttpClient,
  categorySlug: string,
  suffix: string = Date.now().toString(),
): Promise<Id<'products'>> {
  const productSlug = `test-product-${suffix}`
  return await client.mutation(api.products.m.createProduct, {
    name: `Test Product ${suffix}`,
    slug: productSlug,
    categorySlug: categorySlug,
    shortDescription: 'Test product short description',
    description: 'Test product description',
    priceCents: 1000, // $10.00
    unit: 'g',
    availableDenominations: [1, 3.5, 7],
    popularDenomination: 3.5,
    thcPercentage: 20,
    cbdPercentage: 1,
    effects: ['relaxed', 'happy'],
    terpenes: ['myrcene', 'limonene'],
    featured: false,
    available: true,
    stock: 100,
    rating: 4.5,
    image: undefined,
    gallery: undefined,
    consumption: 'Smoke or vape',
    flavorNotes: ['earthy', 'pine'],
    potencyLevel: 'medium',
  })
}

/**
 * Create all test data (user, category, product)
 */
export async function createTestData(
  client: ConvexHttpClient,
  suffix: string = Date.now().toString(),
): Promise<TestData> {
  const userId = await createTestUser(client, suffix)
  const {categoryId, categorySlug} = await createTestCategory(client, suffix)
  const productId = await createTestProduct(client, categorySlug, suffix)

  return {
    userId,
    categoryId,
    productId,
    categorySlug,
  }
}

/**
 * Clean up cart for a user
 */
export async function cleanupCart(
  client: ConvexHttpClient,
  userId: Id<'users'>,
): Promise<void> {
  try {
    await client.mutation(api.cart.m.clearCart, {userId})
  } catch (error) {
    console.error(error)
    // Cart might not exist, ignore
  }
}

/**
 * Get Convex URL from environment
 * Also tries to load from .env.local file if not set
 */
export function getConvexUrl(): string {
  // Try environment variables first
  let url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL

  // If not set, try to read from .env.local synchronously
  if (!url) {
    try {
      // Use Node's fs module which works in Bun

      const envPath = path.join(process.cwd(), '.env.local')

      if (fs.existsSync(envPath)) {
        const text = fs.readFileSync(envPath, 'utf-8')
        const match = text.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)
        if (match && match[1]) {
          url = match[1].trim()
        }
      }
    } catch (error) {
      console.error(error)
      // Ignore errors reading .env.local
    }
  }

  if (!url) {
    throw new Error(
      'CONVEX_URL or NEXT_PUBLIC_CONVEX_URL must be set for tests. ' +
        'Set it in environment or .env.local file.',
    )
  }
  return url
}
