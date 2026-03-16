import {
  fetchCategories,
  fetchFeaturedDeals,
  fetchFireCollections,
  fetchProducts,
} from '@/lib/convexClient'
import {buildTypeFlag, delayFlag} from '@/lib/flags'

import {Content} from './(store)/content'

export default async function LobbyPage() {
  // Evaluate flags
  const [delay, buildType] = await Promise.all([delayFlag(), buildTypeFlag()])

  // Apply delay if configured (for debugging/demo purposes)
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const [
    initialCategories,
    initialCollections,
    initialProducts,
    featuredDeals,
  ] = await Promise.all([
    fetchCategories(),
    fetchFireCollections(),
    fetchProducts(),
    fetchFeaturedDeals(),
  ])

  return (
    <Content
      initialCategories={initialCategories}
      initialCollections={initialCollections}
      initialProducts={initialProducts}
      featuredDeals={featuredDeals}
      delay={delay}
      buildType={buildType}
    />
  )
}
