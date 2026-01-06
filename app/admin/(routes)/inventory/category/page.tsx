import {Metadata} from 'next'
import {type SearchParams} from 'nuqs/server'
import {CategoriesContent} from './content'
import {searchParamsCache} from './searchParams'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Curate collections of products.',
}
type PageProps = {
  searchParams: Promise<SearchParams> // Next.js 15+: async searchParams prop
}
export const dynamic = 'force-dynamic'

const Page = async ({searchParams}: PageProps) => {
  // ⚠️ Don't forget to call `parse` here.
  // You can access type-safe values from the returned object:
  await searchParamsCache.parse(searchParams)
  return <CategoriesContent />
}

export default Page
