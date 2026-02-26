## Update
- timestamp ⸬ Thu Feb 26, 2026  20:10:03 pm - +08:00 

---
### 1. Rewards System Testing (COMPLETED)


tests/cart-computations.test.ts:
- (pass) computeSubtotal > returns 0 for empty cart
- (pass) computeSubtotal > computes single item: priceCents * quantity [0.20ms]
- (pass) computeSubtotal > sums multiple items [0.07ms]
- (pass) computeSubtotal > uses denomination when no priceByDenomination [0.04ms]
- (pass) computeSubtotal > uses priceByDenomination when available [0.08ms]
- (pass) computeSubtotal > accepts custom getUnitPrice for testability [0.03ms]
- (pass) computeTax > returns 0 when tax config is null [0.03ms]
- (pass) computeTax > returns 0 when tax is inactive [0.02ms]
- (pass) computeTax > computes tax when active
- (pass) computeTax > rounds tax to nearest cent
- (pass) computeTax > handles missing taxRatePercent as 0
- (pass) computeShipping > returns 0 when subtotal >= minimum (free shipping)
- (pass) computeShipping > returns 0 when subtotal > minimum
- (pass) computeShipping > returns shipping fee when subtotal < minimum [0.02ms]
- (pass) computeShipping > returns shipping fee for zero subtotal
- (pass) computeOrderTotals > computes all totals correctly [0.04ms]
- (pass) computeOrderTotals > applies shipping when below minimum [0.03ms]
- (pass) computeOrderTotals > uses defaults when shippingConfig is null [0.02ms]
- (pass) getOrderRedirectPath > cards -> /lobby/order/:id/cards [0.24ms]
- (pass) getOrderRedirectPath > cash_app -> /lobby/order/:id/cashapp
- (pass) getOrderRedirectPath > crypto_transfer -> /lobby/order/:id/send
- (pass) getOrderRedirectPath > crypto_commerce -> /lobby/order/:id/crypto
- (pass) getOrderRedirectPath > crypto-payment -> /lobby/order/:id/crypto [0.03ms]
- (pass) getOrderRedirectPath > unknown method defaults to /send
- (pass) getOrderRedirectPath > coerces paymentMethod to string
- (pass) mapCartItemsToRewardsItems > maps to category [0.19ms]
- (pass) mapCartItemsToRewardsItems > uses Uncategorized when categorySlug is missing [0.02ms]
- (pass) mapCartItemsToRewardsItems > maps multiple items
- (pass) computeEstimatedPoints > returns null when not authenticated
- (pass) computeEstimatedPoints > returns null when nextVisitMultiplier is null [0.03ms]
- (pass) computeEstimatedPoints > returns null when nextVisitMultiplier is undefined
- (pass) computeEstimatedPoints > computes points: (subtotal/100) * multiplier
- (pass) computeEstimatedPoints > rounds to nearest integer
- (pass) computeCartRewards > returns currentTier based on subtotal [0.13ms]
- (pass) computeCartRewards > Starter tier for low subtotal [0.07ms]
- (pass) computeCartRewards > isFirstOrder affects free shipping threshold [0.03ms]
- (pass) computeCartRewards > bundle bonus when multiple categories [0.04ms]

 37 pass
 0 fail
 51 expect() calls

### 2. Admin Product Table Issue (NON-REPRODUCIBLE)
* Column headers missing in admin product table

Status:
- Cannot be replicated or duplicated consistently even with the same configurations or parameters.

### 3. Order Confirmation & Chat Process (COMPLETE)

* Clarify how order confirmation page connects to chat rep or assistant 

Status:
- Auto-assign Rep Account.
- Initial Message Seed from AI Assistant
  - Message: "Hi there!, we received your order. A Representative will be with you shortly and assist you in completing your order."
  - Message seed is configurable in Admin Settings > Rep


### 4. Cards Payment Gateway (ON-GOING)
- Paygate (COMPLETED)
- Paylex (ONGOING)
- Rampex (ONGOING)


### 5. General Modifications (COMPLETED)

- Removed Billing form
- Removed Cash App username input
- Chat message date timestamp padding
- Full Description in product detail page

* Consider switching to "Smoke Description" - (PARTIAL)
