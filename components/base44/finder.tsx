import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import TextAnimate from '../expermtl/text-animate'
import {CategoryList} from '../store/category-list'

export const ShopFinder = () => {
  const categories = useQuery(api.categories.q.listCategories)

  return (
    <section className='mb-20 border-2 border-zinc-500/40 rounded-3xl pt-3 mt-16 overflow-hidden dark:bg-dark-gray/10 bg-dark-gray'>
      <div className='relative max-w-7xl mx-auto'>
        <div className='px-6 md:px-10 py-6 my-2'>
          <h2>
            <span className=''>
              <TextAnimate
                className='mr-2 text-white text-xl lg:text-xl font-brk tracking-tight leading-tight'
                text={`Experience by category`}
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
