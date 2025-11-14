import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import {
  createTestData,
  cleanupCart,
  getConvexUrl,
  createTestProduct,
} from "./setup";
import type { TestData } from "./setup";

/**
 * Cart Add to Cart Tests
 * 
 * Tests the addToCart mutation and its reactivity with queries.
 * These tests verify:
 * - Cart creation when adding first item
 * - Adding items to existing cart
 * - Updating quantities for existing items
 * - Query reactivity after mutations
 */

describe("Cart - Add to Cart", () => {
  let client: ConvexHttpClient;
  let testData: TestData | null = null;

  beforeEach(async () => {
    // Initialize Convex client
    const convexUrl = getConvexUrl();
    client = new ConvexHttpClient(convexUrl);

    // Create test data (user, category, product)
    const suffix = Date.now().toString();
    testData = await createTestData(client, suffix);
  });

  afterEach(async () => {
    // Cleanup: Clear cart if it exists
    if (testData?.userId) {
      await cleanupCart(client, testData.userId);
    }
  });

  test("should create cart when adding first item", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add item to cart
    const cartId = await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
    });

    expect(cartId).toBeDefined();

    // Verify cart was created
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });

    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0].productId).toBe(productId);
    expect(cart?.items[0].quantity).toBe(1);
  });

  test("should add new item to existing cart", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId, categorySlug } = testData;

    // Create second product
    const product2Id = await createTestProduct(
      client,
      categorySlug,
      `2-${Date.now()}`,
    );

    // Add first item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
    });

    // Add second item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId: product2Id,
      quantity: 2,
    });

    // Verify both items are in cart
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });

    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(2);
    expect(cart?.items.find(item => item.productId === productId)?.quantity).toBe(1);
    expect(cart?.items.find(item => item.productId === product2Id)?.quantity).toBe(2);
  });

  test("should update quantity when adding same item again", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add item first time
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    // Add same item again
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 3,
    });

    // Verify quantity was updated (2 + 3 = 5)
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });

    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0].quantity).toBe(5);
  });

  test("should handle items with different denominations", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add item with denomination 1
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
      denomination: 1,
    });

    // Add same product with denomination 3.5
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
      denomination: 3.5,
    });

    // Verify both items are in cart (different denominations)
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });

    expect(cart).not.toBeNull();
    expect(cart?.items).toHaveLength(2);
    expect(cart?.items.find(item => item.denomination === 1)?.quantity).toBe(1);
    expect(cart?.items.find(item => item.denomination === 3.5)?.quantity).toBe(1);
  });

  test("should update cart item count query after adding item", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Initial count should be 0
    const initialCount = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(initialCount).toBe(0);

    // Add item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    // Count should be updated
    const updatedCount = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(updatedCount).toBe(2);

    // Add more items
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 3,
    });

    // Count should be updated again (2 + 3 = 5)
    const finalCount = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(finalCount).toBe(5);
  });

  test("should return same cart ID for multiple operations", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add first item
    const cartId1 = await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
    });

    // Add second item
    const cartId2 = await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    // Both should return the same cart ID
    expect(cartId1).toBe(cartId2);
  });

  test("should handle multiple rapid additions", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add items rapidly
    const promises = [
      client.mutation(api.cart.m.addToCart, {
        userId,
        productId,
        quantity: 1,
      }),
      client.mutation(api.cart.m.addToCart, {
        userId,
        productId,
        quantity: 1,
      }),
      client.mutation(api.cart.m.addToCart, {
        userId,
        productId,
        quantity: 1,
      }),
    ];

    await Promise.all(promises);

    // Verify final quantity is correct
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });

    expect(cart).not.toBeNull();
    // Should have 3 items total (all added together)
    expect(cart?.items[0].quantity).toBeGreaterThanOrEqual(3);
  });
});

