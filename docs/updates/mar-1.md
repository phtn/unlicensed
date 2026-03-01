## Update
timestamp ⸬ Sun Mar 01, 2026  18:16:09 pm - +08:00


---
### 1. Secondary Unit conversion (COMPLETED)
- 1/8 oz (3.5g), 1/4 oz (7g), 1/2 oz (14g)

### 2. Deals (Bundle Builder) (ONGOING)
- Page Layout Constructed
- Components (Initial Implementation)
- Mechanics (On-Going Implementation)
  - Products Query Deals Eligibility (COMPLETE)
  - Add Bundle to Cart (COMPLETE)
  - Cart Quantity Tracking (COMPLETE)
  - Computation for bundle (Average of Bundle Denomination or *derived*, ceiled to the nearest $5) (COMPLETED)
  - Bundle Price and Savings Display (COMPLETED)
  - Cart Drawer Bundle Component (COMPLETED)
  - Deals Configurable in Admin (ONGOING)

- Testing (COMPLETED)
tests/deals-types.test.ts:

- ✓ BUNDLE_CONFIGS > has config for every BundleType [0.07ms]
- ✓ BUNDLE_CONFIGS > each config has required fields [0.06ms]
- ✓ BUNDLE_CONFIGS > each variation has required fields [0.06ms]
- ✓ BUNDLE_CONFIGS > defaultVariationIndex is valid when present [0.02ms]
- ✓ BUNDLE_CONFIGS > lowStockThreshold is positive when present [0.02ms]
- ✓ BUNDLE_CONFIGS > build-your-own-oz > has two variations (⅛ and ¼) [0.01ms]
- ✓ BUNDLE_CONFIGS > build-your-own-oz > first variation is 8x⅛ oz [0.01ms]
- ✓ BUNDLE_CONFIGS > build-your-own-oz > second variation is 4x¼ oz [0.01ms]
- ✓ BUNDLE_CONFIGS > build-your-own-oz > has maxPerStrain 2 and lowStockThreshold 3 [0.01ms]
- ✓ BUNDLE_CONFIGS > mix-match-4oz > has single variation 4x1 oz
- ✓ BUNDLE_CONFIGS > mix-match-4oz > maxPerStrain is 1 [0.01ms]
- ✓ BUNDLE_CONFIGS > extracts bundles > extracts-3g: 3 units of 1g
- ✓ BUNDLE_CONFIGS > extracts bundles > extracts-7g: 7 units of 1g [0.04ms]
- ✓ BUNDLE_CONFIGS > edibles-prerolls bundles > both use edibles and pre-rolls categories [0.04ms]
- ✓ BUNDLE_CONFIGS > edibles-prerolls bundles > 5 and 10 units respectively [0.02ms]

tests/deals-searchParams.test.ts:
- ✓ parseSelectionsString > returns empty map for empty string
- ✓ parseSelectionsString > returns empty map for whitespace-only string [0.01ms]
- ✓ parseSelectionsString > parses single product:id [0.03ms]
- ✓ parseSelectionsString > parses multiple products [0.01ms]
- ✓ parseSelectionsString > skips malformed parts (missing quantity) [0.04ms]
- ✓ parseSelectionsString > skips invalid quantity (NaN) [0.01ms]
- ✓ parseSelectionsString > skips zero or negative quantity [0.01ms]
- ✓ parseSelectionsString > trims product ids [0.02ms]
- ✓ serializeSelections > returns empty string for empty map [0.05ms]
- ✓ serializeSelections > serializes single entry [0.04ms]
- ✓ serializeSelections > serializes multiple entries [0.04ms]
- ✓ serializeSelections > filters out entries with quantity <= 0 [0.03ms]
- ✓ serializeSelections > round-trip: parse then serialize preserves data [0.02ms]
- ✓ serializeSelections > round-trip: serialize then parse preserves data [0.07ms]
- ✓ BUNDLE_PARAM_KEYS > has keys for all bundle types [0.03ms]
- ✓ BUNDLE_PARAM_KEYS > variation keys are unique per bundle [0.03ms]
- ✓ BUNDLE_PARAM_KEYS > selection keys are unique per bundle [0.03ms]

tests/deals-stepper.test.tsx:
- ✓ Stepper > renders current value [26.79ms]
- ✓ Stepper > has accessible decrement button [5.59ms]
- ✓ Stepper > has accessible increment button [3.57ms]
- ✓ Stepper > calls onIncrement when increment pressed [8.97ms]
- ✓ Stepper > calls onDecrement when decrement pressed [3.80ms]
- ✓ Stepper > decrement disabled when value at min [2.15ms]
- ✓ Stepper > increment disabled when value at max [1.92ms]
- ✓ Stepper > increment disabled when isComplete [2.28ms]
- ✓ Stepper > respects custom min [2.09ms]

tests/deals-pending-section.test.tsx:
- ✓ PendingDealsSection > renders nothing when outside PendingDealsProvider [1.28ms]
- ✓ PendingDealsSection > renders nothing when pendingDeals is empty [0.72ms]
- ✓ PendingDealsSection > renders section when pending deals exist [8.88ms]

tests/deals-bundle-debug.test.tsx:
- ✓ DealsBundleDebug > renders collapsible details [3.73ms]
- ✓ DealsBundleDebug > shows pipeline counts when expanded [6.46ms]
- ✓ DealsBundleDebug > shows per-product filter reasons when expanded [2.59ms]

 47 pass
 0 fail
 229 expect() calls
