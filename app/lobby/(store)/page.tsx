import {
  fetchCategories,
  fetchFireCollections,
  fetchProducts,
} from '@/lib/convexClient'
import {buildTypeFlag, delayFlag} from '@/lib/flags'
import {all} from 'better-all'

import {Content} from './content'

export default async function StorefrontPage() {
  // Evaluate flags
  const [delay, buildType] = await Promise.all([delayFlag(), buildTypeFlag()])

  // Apply delay if configured (for debugging/demo purposes)
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const {initialCategories, initialCollections, initialProducts} = await all({
    async initialCategories() {
      return await fetchCategories()
    },
    async initialCollections() {
      return await fetchFireCollections()
    },
    async initialProducts() {
      return await fetchProducts()
    },
  })

  return (
    <Content
      delay={delay}
      buildType={buildType}
      initialCategories={initialCategories}
      initialCollections={initialCollections}
      initialProducts={initialProducts}
    />
  )
}
