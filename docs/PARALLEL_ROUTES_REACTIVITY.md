# Parallel Routes & Convex Reactivity

## Overview

This document explains how Next.js parallel routes work with Convex reactivity, specifically how the `@navbar` slot updates when cart items are added from the product detail page.

## What are Parallel Routes?

Parallel routes in Next.js App Router allow you to render multiple pages simultaneously in the same layout. They're defined using the `@folder` syntax (e.g., `@navbar`).

### Key Concepts:

1. **Slots**: Parallel routes create "slots" that can be rendered independently
2. **Shared Layout**: All slots share the same layout component
3. **Shared Context**: All slots share the same React context (including providers)
4. **Independent Loading**: Each slot can have its own loading and error states

## How It Works in This App

### File Structure:

```
app/
  layout.tsx           # Root layout (receives navbar slot as prop)
  @navbar/
    default.tsx        # Navbar slot component
  products/
    [slug]/
      page.tsx         # Product detail page (main content)
```

### Layout Structure:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,      // Main content (product pages, etc.)
  navbar,        // Navbar slot (@navbar)
}: {
  children: React.ReactNode
  navbar?: React.ReactNode
}) {
  return (
    <ProvidersCtxProvider>  {/* Wraps ConvexProvider */}
      <div>
        {navbar}            {/* Navbar slot - shares Convex context */}
        {children}          {/* Main content - shares Convex context */}
      </div>
    </ProvidersCtxProvider>
  )
}
```

### Convex Provider Setup:

```tsx
// ctx/index.tsx
const ProvidersCtxProvider = ({children}) => {
  const convexClient = useMemo(() => getConvexReactClient(), [])
  
  return (
    <ConvexProvider client={convexClient}>
      {children}  {/* This includes both navbar and children */}
    </ConvexProvider>
  )
}
```

## Reactivity Flow

### When User Clicks "Add to Cart":

1. **Product Page (Main Content Slot)**:
   - User clicks "Add to Cart" button
   - `handleAddToCart()` calls `addItem()` from `useCart()` hook
   - `addItem()` calls Convex mutation `addToCart()`

2. **Convex Mutation**:
   - Mutation updates the cart in the Convex database
   - Cart items are added/updated

3. **Convex Reactivity**:
   - Convex automatically detects the database change
   - All subscribed queries are notified of the update
   - This includes the `getCartItemCount` query in the navbar

4. **Navbar Slot (Parallel Route)**:
   - The `useCart()` hook in the Nav component uses `useQuery()` to subscribe to `getCartItemCount`
   - When the query updates, React automatically re-renders the Nav component
   - The `cartItemCount` value updates

5. **Badge Update**:
   - The Badge component receives the new `cartItemCount` value
   - Badge displays the updated count immediately
   - **NO PAGE REFRESH NEEDED**

## Why This Works

### Shared Convex Context:

Both the navbar slot and main content are rendered within the same `ConvexProvider`. This means:

- They share the same Convex client instance
- Queries in one slot can see mutations from another slot
- Reactivity works across all slots automatically

### Convex's Reactive System:

Convex queries automatically subscribe to database changes:

- When a mutation completes, Convex detects which queries are affected
- Affected queries automatically re-run
- React components using those queries automatically re-render

### Key Implementation Details:

1. **Query Subscription**:
   ```tsx
   // hooks/use-cart.ts
   const serverCartItemCount = useQuery(
     api.cart.q.getCartItemCount,
     userId ? {userId} : 'skip',
   )
   ```

2. **Mutation Execution**:
   ```tsx
   // hooks/use-cart.ts
   const addItem = useCallback(async (productId, quantity, denomination) => {
     await addToCart({userId, productId, quantity, denomination})
     // Query automatically updates after mutation completes
   }, [userId, addToCart])
   ```

3. **Component Re-render**:
   ```tsx
   // components/base44/nav.tsx
   const {cartItemCount} = useCart()  // Automatically updates when query changes
   
   <Badge key={`cart-badge-${cartItemCount}`} content={cartItemCount}>
     {/* Badge updates automatically */}
   </Badge>
   ```

## Important Notes

### Key Prop on Badge:

The Badge component uses a `key` prop based on `cartItemCount`:

```tsx
<Badge key={`cart-badge-${cartItemCount}`} ... />
```

This ensures the Badge re-renders when the count changes, which is important for HeroUI Badge component reactivity.

### Debugging:

Development mode includes console logs to verify reactivity:

- `[Nav] Cart item count updated:` - Logs when cart count changes
- `[useCart] serverCartItemCount updated:` - Logs when query updates
- `[ProductDetail] Adding to cart:` - Logs when mutation starts

### Testing:

Integration tests verify reactivity works correctly:

- `tests/cart-reactivity-integration.test.ts` - Tests mutation → query update flow
- `tests/cart-reactivity.test.ts` - Tests query reactivity after mutations
- All tests pass, confirming reactivity works as expected

## Common Issues & Solutions

### Issue: Badge doesn't update

**Possible Causes**:
1. User is not authenticated (queries are skipped)
2. ConvexProvider is not wrapping both slots
3. Badge component not reacting to prop changes

**Solutions**:
1. Ensure user is logged in (queries need userId)
2. Verify ProvidersCtxProvider wraps both navbar and children in layout
3. Use key prop on Badge to force re-render when cartItemCount changes

### Issue: Queries not updating

**Possible Causes**:
1. Queries are being skipped (userId is undefined)
2. Convex client not properly initialized
3. Mutations not completing successfully

**Solutions**:
1. Check that user is authenticated and userId is available
2. Verify ConvexProvider is properly set up in ctx/index.tsx
3. Check console for mutation errors

## Summary

Parallel routes in Next.js work seamlessly with Convex reactivity because:

1. **Shared Context**: All slots share the same ConvexProvider
2. **Automatic Subscriptions**: Convex queries automatically subscribe to changes
3. **React Integration**: React components automatically re-render when queries update
4. **No Manual Refresh**: Updates happen automatically without page refresh

The cart badge in the navbar slot updates immediately when items are added from the product page, even though they're in different parallel route slots, because they share the same Convex context and reactive subscription system.

