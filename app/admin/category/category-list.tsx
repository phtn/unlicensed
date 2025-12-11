import {Doc} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Card, Image} from '@heroui/react'
import Link from 'next/link'
import {useMemo} from 'react'

interface CurrentCategoriesProps {
  categories: Array<Doc<'categories'>> | undefined
}

export const CategoryList = ({categories}: CurrentCategoriesProps) => {
  const heroImages = useMemo(
    () => categories?.map((item) => item.heroImage) ?? [],
    [categories],
  )
  const resolveUrl = useStorageUrls(heroImages)
  return (
    <section className='py-4'>
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
                <Card className='p-4 hover:bg-neutral-50 min-h-32 dark:hover:bg-neutral-900 transition-colors cursor-pointer'>
                  <div className='flex items-center w-full space-x-4'>
                    <Image
                      alt={category.name + '-image'}
                      src={resolveUrl(category.heroImage)}
                      className='size-12 shrink-0 aspect-square'
                    />
                    <div className='flex items-center justify-between w-full'>
                      <h4 className='tracking-tight font-semibold '>
                        {category.name}
                      </h4>
                      <p className='text-xs italic text-neutral-500'>
                        {category.slug}
                      </p>
                    </div>
                  </div>
                  <p className='mt-2 text-sm whitespace-break-spaces opacity-60'>
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
