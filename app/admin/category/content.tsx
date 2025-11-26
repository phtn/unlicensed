'use client'

import {api} from '@/convex/_generated/api'
import {CategoryType} from '@/convex/categories/d'
import {Icon} from '@/lib/icons'
import {Tab, Tabs} from '@heroui/react'
import {useQuery} from 'convex/react'
import {CategoryForm} from '../_components/category-form'

export const Content = () => {
  const categories = useQuery(api.categories.q.listCategories)
  return (
    <div className='flex w-full flex-col gap-4 px-10 py-4 border-t-[0.33px] border-light-gray'>
      <div className='relative'>
        <div className='absolute left-4 top-3 text-xl tracking-tighter font-semibold flex items-center space-x-2'>
          <div className='size-4 aspect-square rounded-full bg-emerald-400'></div>
          <h3>Product Category Manager</h3>
        </div>
        <Tabs
          size='lg'
          variant='solid'
          content='Admin Catalog Manager'
          classNames={{
            tabList: 'bg-sidebar mr-4',
            tabContent: '',
            tab: '',
            base: 'flex flex-1 justify-end',
          }}
          isVertical={false}
          radius='md'>
          <Tab
            key='view'
            className='p-4'
            title={
              <div className='flex items-center space-x-1'>
                <span className='tracking-tighter font-semibold'>
                  Categories
                </span>
                <span className='px-2 font-space'>{categories?.length}</span>
              </div>
            }>
            <CurrentCategories categories={categories} />
          </Tab>
          <Tab
            key='create'
            className='p-4'
            title={
              <div className='flex items-center space-x-1'>
                <Icon name='plus' />
                <span className='tracking-tighter font-semibold pr-2'>
                  Create
                </span>
              </div>
            }>
            <CategoryForm />
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
