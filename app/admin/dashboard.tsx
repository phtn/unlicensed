'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {CategoryForm} from './_components/category-form'
import {ProductForm} from './_components/product-form'

export const AdminDashboard = () => {
  const categories = useQuery(api.categories.q.listCategories)

  const stats = useMemo(() => {
    return {
      totalCategories: categories?.length,
    }
  }, [categories])

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 py-10'>
      <header className='space-y-3'>
        <h1 className='text-2xl font-semibold '>Admin Catalog Manager</h1>
        <p className='max-w-3xl text-sm'>
          Create categories, enrich product details, and manage media assets
          using the TanStack React Form powered workflow below. New entries sync
          directly with Convex.
        </p>
        <div className='flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-neutral-300'>
          <span className='font-semibold text-emerald-400'>
            {stats.totalCategories}
          </span>
          <span>categories available for product assignment.</span>
        </div>
      </header>

      <CategoryForm />
      <ProductForm categories={categories ?? []} />

      <section className='rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-lg shadow-black/30'>
        <h3 className='text-base font-semibold '>Current Categories</h3>
        {categories?.length === 0 ? (
          <p className='mt-3 text-sm text-neutral-500'>
            No categories yet. Create one above to get started.
          </p>
        ) : (
          <ul className='mt-4 grid gap-3 md:grid-cols-2'>
            {categories?.map((category) => (
              <li
                key={category._id}
                className='rounded-lg border border-neutral-800 bg-neutral-900/40 p-4'>
                <h4 className='text-sm font-semibold '>{category.name}</h4>
                <p className='text-xs text-neutral-500'>{category.slug}</p>
                <p className='mt-2 line-clamp-3 text-sm text-neutral-300'>
                  {category.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
