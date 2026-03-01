import {fetchProducts} from '@/lib/convexClient'
import {Metadata} from 'next'
import {DealsContent} from './content'

export const metadata: Metadata = {
  title: 'Deals & Bundles | Hyfe Goods',
  description:
    'Build your own oz, mix & match extracts, edibles and pre-rolls. Custom bundles at great prices.',
}

export default async function DealsPage() {
  const [flower, concentrates, edibles, prerolls] = await Promise.all([
    fetchProducts({categorySlug: 'flower', limit: 50}),
    fetchProducts({categorySlug: 'concentrates', limit: 50}),
    fetchProducts({categorySlug: 'edibles', limit: 50}),
    fetchProducts({categorySlug: 'pre-rolls', limit: 50}),
  ])

  const initialProductsByCategory = {
    flower,
    concentrates,
    edibles,
    'pre-rolls': prerolls,
  }

  return (
    <DealsContent initialProductsByCategory={initialProductsByCategory} />
  )
}
