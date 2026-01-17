import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useCallback, useState} from 'react'
import TextAnimate from '../expermtl/text-animate'
import {CategoryList} from '../store/category-list'

export const ShopFinder = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('category')
  const categories = useQuery(api.categories.q.listCategories)
  const handleFilterChange = useCallback(
    (filter: string) => () => setSelectedFilter(filter),
    [],
  )

  return (
    <section className='mb-20 border-2 border-brand/40 rounded-3xl pt-3 mt-16 overflow-hidden bg-dark-gray'>
      <div className='relative max-w-7xl mx-auto'>
        <div className='px-6 md:px-10 py-6 my-2'>
          <h2>
            <span className=''>
              <TextAnimate
                className='mr-2 text-white text-xl lg:text-xl font-brk tracking-tight leading-tight'
                text={`Experience by ${selectedFilter}`}
              />
            </span>
          </h2>
        </div>

        <div className='relative min-h-fit overflow-hidden'>
          <CategoryList categories={categories} />
        </div>
      </div>
    </section>
  )
}
