# Deals & Bundles — Technical Documentation

## Overview

The Deals system lets customers build custom product bundles at `/lobby/deals`. Bundles are mix-and-match: users choose products and quantities until the required total is reached, then add the bundle to the cart as individual line items.

**Route:** `/lobby/deals`

---

## Architecture

```
app/lobby/(store)/deals/
├── page.tsx                 # Server page, fetches initial products
├── content.tsx              # Client content, loads products by category
├── lib/
│   └── deal-types.ts        # Bundle configs, types
└── components/
    ├── bundle-builder.tsx   # Main builder UI (stepper, add-to-cart)
    ├── stepper.tsx          # +/- quantity control
    └── pending-deals-section.tsx  # Incomplete deals in cart

ctx/
└── pending-deals.tsx        # React context for incomplete bundles

convex/productHolds/
└── q.ts                     # getAvailableQuantities batch query
```

---

## Bundle Types

| ID | Title | Category | Variations | Rules |
|----|-------|----------|------------|-------|
| `build-your-own-oz` | Build Your Own Oz | Flower | 8×⅛ oz, 4×¼ oz | Max 2/strain; limit 1 when ⅛ stock ≤3; remove when ⅛ stock=0 |
| `mix-match-4oz` | Mix & Match 4 Oz | Flower | 4×1 oz | Max 1 oz per strain |
| `extracts-3g` | 3×1g Mix & Match | Concentrates | 3×1g | Max 1 per strain |
| `extracts-7g` | 7×1g Mix & Match | Concentrates | 7×1g | Max 1 per strain |
| `edibles-prerolls-5` | 5×1 Unit Mix & Match | Edibles + Pre-rolls | 5×1 unit | Max 1 per strain |
| `edibles-prerolls-10` | 10×1 Unit Mix & Match | Edibles + Pre-rolls | 10×1 unit | Max 1 per strain |

---

## Bundle Configuration

Bundle configs live in `app/lobby/(store)/deals/lib/deal-types.ts`:

```ts
interface BundleConfig {
  id: BundleType
  title: string
  description: string
  categorySlugs: string[]        // e.g. ['flower'], ['edibles','pre-rolls']
  variations: BundleVariation[]  // e.g. 8×3.5g or 4×7g
  defaultVariationIndex?: number
  maxPerStrain: number           // Max units of same product per bundle
  lowStockThreshold?: number     // When stock ≤ this, limit to 1 per strain (Build Your Own Oz)
}

interface BundleVariation {
  totalUnits: number             // e.g. 8 for 8×⅛ oz
  denominationPerUnit: number    // e.g. 3.5 for ⅛ oz (grams)
  unitLabel: string              // e.g. "⅛ oz"
}
```

**Denomination units**

- Flower: 3.5g = ⅛ oz, 7g = ¼ oz, 28g = 1 oz  
- Concentrates: 1g  
- Edibles / pre-rolls: 1 = 1 unit

---

## Data Flow

### 1. Page load

- **Server:** `page.tsx` calls `fetchProducts` for flower, concentrates, edibles, pre-rolls and passes them as `initialProductsByCategory`.
- **Client:** `content.tsx` subscribes to Convex `listProducts` by category and falls back to initial data while loading.
- Products are mapped through `adaptProduct` and image URLs resolved via `useStorageUrls`.

### 2. Product → bundle mapping

`content.tsx` maps categories to bundles:

| Bundle | Products source |
|--------|-----------------|
| build-your-own-oz, mix-match-4oz | `flower` |
| extracts-3g, extracts-7g | `concentrates` |
| edibles-prerolls-5, edibles-prerolls-10 | `edibles` + `prerolls` |

### 3. Product filtering (BundleBuilder)

Each BundleBuilder receives `config`, `products`, and `productIds`. It:

1. Builds `pairs` of `{productId, denomination}` for the selected variation.
2. Calls `getAvailableQuantities` with `pairs`.
3. Uses `filterProductsForVariation` to show only products that:
   - Have `availableDenominations` including the variation’s denomination.
   - Have `available > 0` (from `availableMap`).
4. For Build Your Own Oz (denom 3.5), products with stock 0 are omitted (per requirements).

### 4. Availability calculation

`convex/productHolds/q.ts` → `getAvailableQuantities`:

```
available = product.stock - held
```

- **Stock:** from `product.stockByDenomination[denom]` or `product.stock`.
- **Held:** sum of non-expired `productHolds` for that product and denomination.

`productHolds` reserve items for carts; expired holds are ignored. This avoids overselling and keeps availability accurate across users.

---

## User Flow

1. User opens `/lobby/deals`.
2. For each deal card, they pick a variation (if multiple, e.g. 8×⅛ vs 4×¼).
3. They adjust quantity per product with the Stepper.
4. Stepper `max` is capped by:
   - Available quantity.
   - `maxPerStrain`.
   - For Build Your Own Oz with denom 3.5: if stock ≤ `lowStockThreshold` (3), max = 1.
5. Progress shows as `totalSelected / requiredTotal`.
6. When `totalSelected >= requiredTotal`, the “Add bundle to cart” button becomes enabled.
7. On “Add bundle to cart,” each line is added via `addItem(productId, 1, denom)`.
8. Selections are cleared and the pending deal is cleared.

---

## Pending Deals

Incomplete bundles are stored in `PendingDealsProvider` (React state, not persisted).

### When they appear

- `BundleBuilder` syncs pending deals on selection changes (via `syncPending` in `useEffect`).
- If the user has made selections but not reached the required total, the deal is pending.
- Pending deals are shown in the cart and empty-cart UI via `PendingDealsSection`.

### PendingDealsContext API

```ts
setPendingDeal(bundleType, items, requiredTotal)  // Update or add
clearPendingDeal(bundleType)                      // Remove one
clearAllPending()                                 // Remove all
```

`items` is `PendingBundleItem[]`:

```ts
{
  productId, productName, quantity, denomination, priceCents
}
```

### Avoiding infinite loops

`syncPending` depends on `setPendingDeal` and `clearPendingDeal` (both stable `useCallback` with `[]`), not on the full `pendingCtx` object. This avoids re-running the effect when `pendingDeals` updates and prevents maximum update depth errors.

---

## Cart Integration

- Bundle items are added as normal cart lines via `addItem(productId, quantity, denomination)`.
- There is no special “bundle” cart type; the cart only sees individual product lines.
- `PendingDealsSection` appears in `CartItemsSection` and `EmptyCart` when there are incomplete deals, with a link back to `/lobby/deals`.

---

## Add to Cart

When “Add bundle to cart” is pressed:

```ts
for (const [, v] of selections) {
  for (let i = 0; i < v.quantity; i++) {
    await addItem(v.productId, 1, denom)
  }
}
```

Each unit is added as its own cart add (quantity 1). The cart mutation merges identical `productId` + `denomination` lines. Product holds are created by the cart mutation.

---

## Product Requirements

For a product to appear in a deal:

1. `categorySlug` matches the bundle’s `categorySlugs`.
2. `availableDenominations` contains the bundle’s `denominationPerUnit`.
3. `_id` exists (Convex ID).
4. `available > 0` for that product and denomination.

Products using fallback/seed data without Convex IDs will not appear, because `productIds` will be empty and no availability query will run.

---

## Extending the System

### Add a new bundle

1. Extend `BundleType` in `deal-types.ts`.
2. Add an entry to `BUNDLE_CONFIGS`.
3. Append the new ID to `DEAL_BUNDLE_IDS` in `content.tsx`.
4. Wire it to the correct products in `buildProps` in `content.tsx`.

### Add a variation

Extend `variations` on the relevant config:

```ts
variations: [
  { totalUnits: 8, denominationPerUnit: 3.5, unitLabel: '⅛ oz' },
  { totalUnits: 4, denominationPerUnit: 7, unitLabel: '¼ oz' },
  // New variation
  { totalUnits: 2, denominationPerUnit: 14, unitLabel: '½ oz' },
]
```

### Add a new category

1. Add the category slug to `categorySlugs` in the config.
2. In `content.tsx`, add a query and products list for that category.
3. Include it in the `products` array for the relevant bundle in `buildProps`.

---

## Known Considerations

1. **Loading state:** While `getAvailableQuantities` is loading, `availableMap` is `undefined` → `{}`. That can filter out all products until the query resolves. Consider showing products optimistically or using a loading state.
2. **Empty productIds:** If products lack `_id`, `productIds` is empty and the availability query gets an empty `pairs` array. Products from Convex have `_id`; fallback/seed products may not.
3. **Persistence:** Pending deals live only in React state. A full page refresh or navigation clears them.
