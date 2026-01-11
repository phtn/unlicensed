import {fetchProducts} from '@/lib/convexClient'

import {Content} from './content'

export default async function StrainFinderPage() {
  const initialProducts = await fetchProducts()

  return <Content initialProducts={initialProducts} />
}

