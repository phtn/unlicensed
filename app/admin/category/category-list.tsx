import {Doc} from '@/convex/_generated/dataModel'

interface CurrentCategoriesProps {
  categories: Array<Doc<'categories'>> | undefined
}

export const CategoryList = ({categories}: CurrentCategoriesProps) => {
  return (
    <section className='rounded-3xl border dark:border-light-gray border-dark-gray px-6 py-8 shadow-xs shadow-black/30'>
      <h3 className='text-base font-semibold '>Active Categories</h3>
      {categories?.length === 0 ? (
        <p className='mt-3 text-sm text-neutral-500'>
          No categories yet. Create one above to get started.
        </p>
      ) : (
        <ul className='mt-4 grid gap-3 md:grid-cols-2'>
          {categories?.map((category) => (
            <li
              key={category._id}
              className='rounded-lg border border-neutral-500/40 p-4'>
              <h4 className='text-sm font-semibold '>{category.name}</h4>
              <p className='text-xs text-neutral-500'>{category.slug}</p>
              <p className='mt-2 line-clamp-3 text-sm opacity-60'>
                {category.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
