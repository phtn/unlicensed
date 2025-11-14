import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import {
  createTestData,
  cleanupCart,
  getConvexUrl,
} from "./setup";
import type { TestData } from "./setup";

/**
 * Cart Reactivity Integration Tests
 * 
 * These tests verify that mutations trigger query updates reactively,
 * simulating the real-world flow of adding items to cart and checking
 * if the badge would update.
 * 
 * This tests the exact flow:
 * 1. Add item via mutation (simulating product page)
 * 2. Query cart item count (simulating navbar badge)
 * 3. Verify the count updated immediately without manual refresh
 */

describe("Cart - Reactivity Integration", () => {
  let client: ConvexHttpClient;
  let testData: TestData | null = null;

  beforeEach(async () => {
    const convexUrl = getConvexUrl();
    client = new ConvexHttpClient(convexUrl);

    const suffix = `integration-${Date.now()}`;
    testData = await createTestData(client, suffix);
  });

  afterEach(async () => {
    if (testData?.userId) {
      await cleanupCart(client, testData.userId);
    }
  });

  test("mutation should trigger immediate query update", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Initial count should be 0
    let count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(0);

    // Simulate adding item to cart (like clicking "Add to Cart" on product page)
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 1,
    });

    // Query should immediately reflect the change (simulating navbar badge query)
    // In a real app, this query would automatically update via Convex reactivity
    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(1);

    // Add another item
    await client.mutation(api.cart.m.addToCart, {
      userId,
      productId,
      quantity: 2,
    });

    // Query should immediately reflect the change
    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(3); // 1 + 2 = 3
  });

  test("multiple rapid mutations should all be reflected", async () => {
    if (!testData) {
      throw new Error("Test setup failed");
    }

    const { userId, productId } = testData;

    // Simulate rapid clicks on "Add to Cart"
    await Promise.all([
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
    ]);

    // Query should reflect all changes
    const count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("query should update after remove mutation", async () => {
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

    // Query should immediately reflect the change
    count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });
    expect(count).toBe(0);
  });

  test("query should stay in sync with cart data", async () => {
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

    // Get both cart and count
    const cart = await client.query(api.cart.q.getCart, {
      userId,
    });
    const count = await client.query(api.cart.q.getCartItemCount, {
      userId,
    });

    // They should be in sync
    expect(cart).not.toBeNull();
    const calculatedCount = cart!.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    expect(count).toBe(calculatedCount);
    expect(count).toBe(3);
  });
});

