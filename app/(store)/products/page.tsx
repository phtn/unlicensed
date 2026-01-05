import {fetchProducts} from '@/lib/convexClient'
import {Suspense} from 'react'
import {Content} from './content'
import {Loader} from '@/components/expermtl/loader'

const Page = async () => {
  const initialProducts = await fetchProducts({limit: 100})
  return (
    <Suspense fallback={<Loader />}>
      <Content initialProducts={initialProducts} />
    </Suspense>
  )
}

export default Page
