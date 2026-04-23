# HeroUI v3 Migration

## Current State

- `@heroui/react@3.0.2` is already installed.
- Tailwind CSS v4 and `@heroui/styles` are already imported in [app/globals.css](/Users/xpriori/Code/RapidFire/app/globals.css).
- No `HeroUIProvider` remains in [app/layout.tsx](/Users/xpriori/Code/RapidFire/app/layout.tsx).
- The migration is complete; no files import `@/lib/heroui` anymore.

## Inventory

- Total files importing `@/lib/heroui`: `197`
- Remaining files importing `@/lib/heroui`: `0`
- Low-risk files: `0`
- Medium-risk files: `0`
- High-risk files: `0`

These buckets were used to drive the migration order while the shim was still active:

- Low-risk: files using components that still exist in v3 and do not rely on shim-only adapters.
- Medium-risk: files using compatibility exports like `CardContent`, `CardHeader`, modal/drawer wrappers, or legacy prop typing helpers.
- High-risk: files using v2-only or shim-heavy exports like `Image`, `User`, or `Navbar*`.

Primary migration drivers in the current codebase:

- `color`: `64` files
- `classNames`: `62` files
- `CardContent`: `29` files
- `isLoading`: `28` files
- `Image`: `32` files
- `User`: `9` files

## Migration Order

1. Migrate low-risk files to direct `@heroui/react` imports.
2. Migrate medium-risk files by replacing v2 structure with v3 compound components.
3. Replace removed v2 components with app-local primitives:
   - `Image` -> `next/image` or native `img`
   - `User` -> `Avatar` + text composition
   - `Navbar*` -> app-local layout components
   - `useDisclosure` -> local state or `useOverlayState`
4. Remove the shim only after there are no remaining imports from `@/lib/heroui`.

## Rules For This Repo

- Keep the shim in place while migrations are in progress.
- Prefer direct `@heroui/react` imports for v3-ready files.
- Replace legacy `CardHeader` / `CardContent` with `Card.Header` / `Card.Content`.
- Replace removed styling props like `shadow`, `radius`, and `color` with v3 variants or Tailwind classes.
- Avoid starting with files that depend on removed components or link-as-component adapters unless that slice is the explicit target.

## First Batch

- [x] [app/(legal)/[slug]/layout.tsx](/Users/xpriori/Code/RapidFire/app/(legal)/[slug]/layout.tsx)
- [x] [app/(legal)/_components/document-page.tsx](/Users/xpriori/Code/RapidFire/app/(legal)/_components/document-page.tsx)
- [x] [app/(legal)/content.tsx](/Users/xpriori/Code/RapidFire/app/(legal)/content.tsx)
- [x] [app/account/chat/[id]/page.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/[id]/page.tsx)
- [x] [app/account/chat/_components/assistant-message-input.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/_components/assistant-message-input.tsx)
- [x] [app/account/chat/_components/assistant-message-list.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/_components/assistant-message-list.tsx)
- [x] [app/account/chat/_components/conversation-list.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/_components/conversation-list.tsx)
- [x] [app/account/chat/_components/conversation-search.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/_components/conversation-search.tsx)
- [x] [app/account/chat/_components/message-bubble.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/_components/message-bubble.tsx)
- [x] [app/account/chat/_components/message-input.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/_components/message-input.tsx)
- [x] [app/account/chat/content.tsx](/Users/xpriori/Code/RapidFire/app/account/chat/content.tsx)
- [x] [app/account/orders/[order-number]/_components/actions.tsx](/Users/xpriori/Code/RapidFire/app/account/orders/[order-number]/_components/actions.tsx)
- [x] [app/account/orders/[order-number]/page.tsx](/Users/xpriori/Code/RapidFire/app/account/orders/[order-number]/page.tsx)
- [x] [app/account/orders/content.tsx](/Users/xpriori/Code/RapidFire/app/account/orders/content.tsx)
- [x] [app/account/_components/order-list-item.tsx](/Users/xpriori/Code/RapidFire/app/account/_components/order-list-item.tsx)
- [x] [app/account/_components/order-status.tsx](/Users/xpriori/Code/RapidFire/app/account/_components/order-status.tsx)
- [x] [app/account/_components/profile-card.tsx](/Users/xpriori/Code/RapidFire/app/account/_components/profile-card.tsx)
- [x] [app/account/_components/recent-orders.tsx](/Users/xpriori/Code/RapidFire/app/account/_components/recent-orders.tsx)
- [x] [app/account/_components/user-stats-card.tsx](/Users/xpriori/Code/RapidFire/app/account/_components/user-stats-card.tsx)
- [x] [app/account/_components/reward-points.tsx](/Users/xpriori/Code/RapidFire/app/account/_components/reward-points.tsx)
- [x] [app/account/orders/[order-number]/_components/section.tsx](/Users/xpriori/Code/RapidFire/app/account/orders/[order-number]/_components/section.tsx)
- [x] [app/account/profile-info.tsx](/Users/xpriori/Code/RapidFire/app/account/profile-info.tsx)
- [x] [app/account/quick-links.tsx](/Users/xpriori/Code/RapidFire/app/account/quick-links.tsx)
- [x] [app/admin/_components/ui/access-denied.tsx](/Users/xpriori/Code/RapidFire/app/admin/_components/ui/access-denied.tsx)
- [x] [app/admin/_components/stat-settings.tsx](/Users/xpriori/Code/RapidFire/app/admin/_components/stat-settings.tsx)
- [x] [app/admin/_components/ui/junction-box.tsx](/Users/xpriori/Code/RapidFire/app/admin/_components/ui/junction-box.tsx)
- [x] [app/admin/settings/purge.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/purge.tsx)
- [x] [app/admin/settings/_components/components.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/components.tsx)
- [x] [app/admin/settings/_components/shipping-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/shipping-content.tsx)
- [x] [app/admin/settings/_components/access-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/access-content.tsx)
- [x] [app/admin/settings/_components/assistant-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/assistant-content.tsx)
- [x] [app/admin/settings/_components/crypto-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/crypto-content.tsx)
- [x] [app/admin/settings/_components/payments-settings.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/payments-settings.tsx)
- [x] [app/admin/settings/_components/tax-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/tax-content.tsx)
- [x] [app/admin/settings/paygate.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/paygate.tsx)
- [x] [app/admin/settings/_components/overview-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/overview-content.tsx)
- [x] [app/admin/settings/_components/alerts-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/alerts-content.tsx)
- [x] [app/admin/settings/_components/rewards-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/rewards-content.tsx)
- [x] [app/admin/settings/_components/rep-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/rep-content.tsx)
- [x] [app/admin/settings/_components/deals-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/deals-content.tsx)
- [x] [app/admin/settings/_components/coupons-content.tsx](/Users/xpriori/Code/RapidFire/app/admin/settings/_components/coupons-content.tsx)
- [x] [components/base44/news.tsx](/Users/xpriori/Code/RapidFire/components/base44/news.tsx)
- [x] [components/base44/quick-scroll.tsx](/Users/xpriori/Code/RapidFire/components/base44/quick-scroll.tsx)
- [x] [components/ui/footer.tsx](/Users/xpriori/Code/RapidFire/components/ui/footer.tsx)
- [x] [components/main/faqs-section.tsx](/Users/xpriori/Code/RapidFire/components/main/faqs-section.tsx)
- [x] [components/main/highlights/slider.tsx](/Users/xpriori/Code/RapidFire/components/main/highlights/slider.tsx)
- [x] [components/ui/theme-toggle.tsx](/Users/xpriori/Code/RapidFire/components/ui/theme-toggle.tsx)

## Next Recommended Buckets

- Admin settings/forms that still depend on legacy `Card`, `Select`, `User`, and `TextArea` helpers.
- Store and lobby pages that still rely on shimmed `Image`.
- Table/admin data views that still use legacy `User`, `Link`, and selection helpers.
