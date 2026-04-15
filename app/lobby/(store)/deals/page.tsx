import {fetchProducts} from '@/lib/convexClient'
import {Metadata} from 'next'
import {DealsContent} from './content'

export const metadata: Metadata = {
  title: 'Deals & Bundles | Hyfe Goods',
  description:
    'Build your own oz, mix & match extracts, edibles and pre-rolls. Custom bundles at great prices.',
}

export default async function DealsPage() {
  const [flower, extracts, edibles, prerolls, vapes] = await Promise.all([
    fetchProducts({
      categorySlug: 'flower',
      limit: 100,
      eligibleForDeals: true,
    }),
    fetchProducts({
      categorySlug: 'extracts',
      limit: 100,
      eligibleForDeals: true,
    }),
    fetchProducts({
      categorySlug: 'edibles',
      limit: 100,
      eligibleForDeals: true,
    }),
    fetchProducts({
      categorySlug: 'pre-rolls',
      limit: 100,
      eligibleForDeals: true,
    }),
    fetchProducts({
      categorySlug: 'vapes',
      limit: 50,
      eligibleForDeals: true,
    }),
  ])

  const initialProductsByCategory = {
    flower,
    extracts,
    edibles,
    'pre-rolls': prerolls,
    vapes,
  }

  return <DealsContent initialProductsByCategory={initialProductsByCategory} />
}
