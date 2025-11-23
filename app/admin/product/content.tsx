'use client'

import {api} from '@/convex/_generated/api'
import {CategoryType} from '@/convex/categories/d'
import {Icon} from '@/lib/icons'
import {Tab, Tabs} from '@heroui/react'
import {useQuery} from 'convex/react'
import {ProductForm} from '../_components/product-form'

export const Content = () => {
  const categories = useQuery(api.categories.q.listCategories)
  return (
    <div className='flex w-full flex-col gap-4 px-10'>
      <div className='relative'>
        <h3 className='absolute left-4 top-3 text-xl tracking-tighter font-semibold'>
          Product Catalog
        </h3>
        <Tabs
          size='lg'
          color='primary'
          variant='solid'
          content='Product Catalog Manager'
          classNames={{
            tabList: '',
            base: 'flex flex-1 justify-end',
          }}
          isVertical={false}
          radius='md'>
          <Tab
            key='photos'
            title={
              <div className='flex items-center space-x-1'>
                <Icon name='plus' />
                <span className='tracking-tighter font-semibold pr-2'>
                  Create
                </span>
              </div>
            }>
            <ProductForm categories={categories} />
          </Tab>
          <Tab
            key='music'
            title={
              <div className='flex items-center space-x-1'>
                <Icon name='eye' />
                <span className='tracking-tighter font-semibold'>
                  View Categories
                </span>
                <span className='px-2 font-space'>{categories?.length}</span>
              </div>
            }>
            <CurrentCategories categories={categories} />
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}

interface CurrentCategoriesProps {
  categories: CategoryType[] | undefined
}

const CurrentCategories = ({categories}: CurrentCategoriesProps) => {
  return (
    <section className='rounded-xl border border-neutral-800 p-6 shadow-lg shadow-black/30'>
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
