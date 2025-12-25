import {fetchCategories, fetchProducts} from '@/lib/convexClient'
import {buildTypeFlag, delayFlag} from '@/lib/flags'

import {Content} from './content'

export default async function StorefrontPage() {
  // Evaluate flags
  const [delay, buildType] = await Promise.all([
    delayFlag(),
    buildTypeFlag(),
  ])

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
