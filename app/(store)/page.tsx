import {fetchCategories, fetchProducts} from '@/lib/convexClient'

import {Content} from './content'

export default async function StorefrontPage() {
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts(),
  ])

  return <Content categories={categories} products={products} />
}
