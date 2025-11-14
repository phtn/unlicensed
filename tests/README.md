# Cart Tests

This directory contains tests for the cart functionality using Bun's test API.

## Setup

1. Ensure you have a Convex deployment running:
   ```bash
   bun run convex:dev
   ```

2. Set the Convex URL environment variable:
   ```bash
   export NEXT_PUBLIC_CONVEX_URL="your-convex-url"
   # or
   export CONVEX_URL="your-convex-url"
   ```

## Running Tests

Run all tests:
```bash
bun test
```

Run tests in watch mode:
```bash
bun test:watch
```

Run a specific test file:
```bash
bun test tests/cart.test.ts
```

## Test Files

### `cart.test.ts`
Tests the `addToCart` mutation functionality:
- Cart creation when adding first item
- Adding items to existing cart
- Updating quantities for existing items
- Handling items with different denominations
- Multiple rapid additions

### `cart-reactivity.test.ts`
Tests the reactivity of cart queries after mutations:
- Query updates after mutations
- Multiple queries staying in sync
- Real-time updates
- All CRUD operations (add, update, remove, clear)

## Test Structure

Each test file:
1. Sets up test data (user, category, product) in `beforeEach`
2. Cleans up test data in `afterEach`
3. Tests specific functionality with assertions
4. Uses the Convex HTTP client for mutations and queries

## Debugging

If tests fail:
1. Check that Convex is running
2. Verify the Convex URL is set correctly
3. Check that test data is being created properly
4. Look at the error messages for specific failures

## Notes

- Tests create real data in your Convex deployment
- Tests clean up after themselves, but you may need to manually clean up if tests fail
- Tests use unique timestamps to avoid conflicts
- Tests verify both mutations and queries work correctly

