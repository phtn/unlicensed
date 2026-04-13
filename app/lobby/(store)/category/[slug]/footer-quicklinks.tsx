import {Doc} from '@/convex/_generated/dataModel'
import Link from 'next/link'

interface FooterQuickLinksProps {
  categories: Doc<'categories'>[] | undefined
  slug: string
}

export const FooterQuickLinks = ({categories, slug}: FooterQuickLinksProps) => {
  return (
    <section className='py-6 sm:py-10 lg:py-20 px-6 md:px-0 max-w-7xl mx-auto'>
      <div className='flex flex-col xl:gap-10'>
        <div className='space-y-2 xl:space-y-0 xl:flex items-center justify-between w-full'>
          <div className='w-fit'>
            <h2 className='text-2xl font-clash font-bold whitespace-nowrap tracking-normal md:text-2xl lg:text-3xl'>
              Browse Category
            </h2>
          </div>
          <div className='grid grid-cols-1 gap-1 min-[360px]:grid-cols-3 border w-full xl:w-auto xl:grid-flow-col xl:auto-cols-auto'>
            <Link
              key={'deals-link'}
              prefetch
              href={`/lobby/deals`}
              className='flex min-w-0 items-center justify-center bg-terpenes px-3 py-2 sm:px-3 sm:py-2 text-center text-sm font-medium capitalize tracking-tight text-white opacity-100 hover:bg-brand hover:text-white dark:bg-terpenes dark:text-white dark:hover:text-text sm:text-base lg:text-lg'>
              <span className='max-w-full wrap-break-word whitespace-normal drop-shadow-xs'>
                Deals
              </span>
            </Link>
            {categories
              ?.filter((cat) => cat.slug !== slug)
              .map((cat) => (
                <Link
                  key={cat._id}
                  prefetch
                  href={`/lobby/category/${cat.slug}`}
                  className='flex min-w-28 items-center justify-center bg-foreground px-3 py-2 sm:px-3 sm:py-2 text-center text-sm font-medium capitalize tracking-tight text-white opacity-100 hover:bg-brand hover:text-white dark:bg-white dark:text-dark-gray dark:hover:text-white sm:text-base lg:text-lg'>
                  <span className='max-w-full wrap-break-word whitespace-normal drop-shadow-xs'>
                    {cat.name}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}
