import {fetchCategories, fetchProducts} from '@/lib/convexClient'
import {buildTypeFlag, delayFlag} from '@/lib/flags'

import {Content} from './(store)/content'

export default async function LobbyPage() {
  // Evaluate flags
  const [delay, buildType] = await Promise.all([delayFlag(), buildTypeFlag()])

  // Apply delay if configured (for debugging/demo purposes)
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const [initialCategories, initialProducts] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
  ])

  return (
    <Content
      initialCategories={initialCategories}
      initialProducts={initialProducts}
      delay={delay}
      buildType={buildType}
    />
  )
}
