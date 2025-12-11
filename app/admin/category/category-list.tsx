import {Doc} from '@/convex/_generated/dataModel'
import {Card} from '@heroui/react'
import Link from 'next/link'

interface CurrentCategoriesProps {
  categories: Array<Doc<'categories'>> | undefined
}

export const CategoryList = ({categories}: CurrentCategoriesProps) => {
  return (
    <section className=''>
      <h3 className='text-2xl tracking-tighter font-semibold px-2'>
        Active Categories
      </h3>
      {categories?.length === 0 ? (
        <p className='mt-3 text-sm text-neutral-500'>
          No categories yet. Create one above to get started.
        </p>
      ) : (
        <ul className='mt-4 grid gap-3 md:grid-cols-3'>
          {categories?.map((category) => (
            <li key={category._id} className=''>
              <Link href={`/admin/category/${category.slug}`}>
                <Card className='p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer'>
                  <div className='flex items-center justify-between'>
                    <h4 className='tracking-tight font-semibold '>
                      {category.name}
                    </h4>
                    <p className='text-xs italic text-neutral-500'>
                      {category.slug}
                    </p>
                  </div>
                  <p className='mt-2 line-clamp-3 text-sm opacity-60'>
                    {category.description}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
