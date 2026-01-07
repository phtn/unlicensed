'use client'

import {Nav} from '@/components/main/nav'

/**
 * Navbar Slot Component for Lobby
 *
 * This is a Next.js parallel route slot (@navbar). Parallel routes allow you to
 * render multiple pages simultaneously in the same layout.
 *
 * IMPORTANT: This slot is rendered within the same ConvexProvider as the main
 * content (see app/layout.tsx). This means:
 * - The Nav component shares the same Convex client instance
 * - Convex queries in this component will update reactively when mutations
 *   happen in other parts of the app (e.g., when items are added to cart)
 * - The cart badge will automatically update when cart items change, even
 *   though this is in a separate parallel route slot
 *
 * Reactivity Flow:
 * 1. User clicks "Add to Cart" on product page (in main content slot)
 * 2. Mutation runs via Convex (addToCart)
 * 3. Convex database updates
 * 4. All subscribed queries automatically update (including cartItemCount)
 * 5. Nav component re-renders with new cartItemCount
 * 6. Badge displays updated count - NO PAGE REFRESH NEEDED
 */
const NavbarSlot = () => {
  return <Nav />
}

export default NavbarSlot
