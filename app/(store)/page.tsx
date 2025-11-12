import {fetchCategories, fetchProducts} from '@/lib/convexClient'

import {Content} from './content'

export default async function StorefrontPage() {
  const [initialCategories, initialProducts] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
  ])

  return (
    <Content
      initialCategories={initialCategories}
      initialProducts={initialProducts}
    />
  )
}
