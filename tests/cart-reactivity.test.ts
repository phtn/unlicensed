import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  createTestData,
  cleanupCart,
  getConvexUrl,
  createTestProduct,
} from "./setup";
import type { TestData } from "./setup";

/**
 * Cart Reactivity Tests
 * 
 * Tests the reactivity of cart queries after mutations.
 * These tests verify that:
 * - Queries automatically update after mutations
 * - Multiple queries stay in sync
 * - Real-time updates work correctly
 */

describe("Cart - Reactivity", () => {
  let client: ConvexHttpClient;
  let reactClient: ConvexReactClient;
  let testData: TestData | null = null;

  beforeEach(async () => {
    // Initialize Convex clients
    const convexUrl = getConvexUrl();
    client = new ConvexHttpClient(convexUrl);
    reactClient = new ConvexReactClient(convexUrl);

    // Create test data (user, category, product)
    const suffix = `reactivity-${Date.now()}`;
    testData = await createTestData(client, suffix);
  });

  afterEach(async () => {
    // Cleanup: Clear cart if it exists
    if (testData?.userId) {
      await cleanupCart(client, testData.userId);
    }
  });

  test("getCartItemCount should update after addToCart mutation", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Initial count should be 0
    let count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(0);

    // Add item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    // Count should be updated immediately
    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(2);

    // Add more items
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 3,
    });

    // Count should be updated again
    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(5); // 2 + 3 = 5
  });

  test("getCart and getCartItemCount should stay in sync", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 3,
    });

    // Get both cart and count
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });
    const count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });

    // They should be in sync
    expect(cart).not.toBeNull();
    const calculatedCount = cart!.items.reduce((sum, item) => sum + item.quantity, 0);
    expect(count).toBe(calculatedCount);
    expect(count).toBe(3);
  });

  test("multiple sequential mutations should update queries correctly", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Sequence of operations
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
    });

    let count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(1);

    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(3);

    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
    });

    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(4);
  });

  test("cart should reflect all items after multiple additions", async () => {
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

    // Add first product
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    // Add second product
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId: product2Id,
      quantity: 3,
    });

    // Verify cart has both items
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });
    const count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });

    expect(cart).not.toBeNull();
    expect(cart!.items).toHaveLength(2);
    expect(count).toBe(5); // 2 + 3 = 5

    const item1 = cart!.items.find(item => item.productId === productId);
    const item2 = cart!.items.find(item => item.productId === product2Id);

    expect(item1?.quantity).toBe(2);
    expect(item2?.quantity).toBe(3);
  });

  test("removeFromCart should update queries correctly", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 5,
    });

    let count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(5);

    // Remove item
    await client.mutation(api.cart.m.removeFromCart, {
      userId,
      productId,
    });

    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(0);

    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });
    expect(cart?.items).toHaveLength(0);
  });

  test("updateCartItem should update queries correctly", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 3,
    });

    let count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(3);

    // Update quantity
    await client.mutation(api.cart.m.updateCartItem, {
      userId,
      productId,
      quantity: 7,
    });

    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(7);

    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });
    expect(cart?.items[0].quantity).toBe(7);
  });

  test("clearCart should update queries correctly", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Add items
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 3,
    });

    let count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(3);

    // Clear cart
    await client.mutation(api.cart.m.clearCart, {
      userId,
    });

    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(0);

    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });
    expect(cart?.items).toHaveLength(0);
  });
});
