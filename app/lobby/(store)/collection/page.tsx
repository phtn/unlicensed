import {fetchCategories, fetchProducts} from '@/lib/convexClient'
import {all} from 'better-all'
import {Content} from './content'

const Page = async () => {
  const {initialCategories, initialProducts} = await all({
    async initialCategories() {
      return await fetchCategories()
    },
    async initialProducts() {
      return await fetchProducts()
    },
  })
  return (
    <Content
      initialCategories={initialCategories}
      initialProducts={initialProducts}
    />
  )
}

export default Page
