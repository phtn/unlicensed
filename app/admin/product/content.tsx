'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Tab, Tabs} from '@heroui/react'
import {useQuery} from 'convex/react'
import {Key, useState} from 'react'
import {ProductForm} from '../_components/product-form'
import {BadgeList} from './badges'
import {CurrentProducts} from './products'

export const ProductsList = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  const categories = useQuery(api.categories.q.listCategories)
  const [selectedTab, setSelectedTab] = useState<Key>('products')
  return (
    <div className='flex w-full flex-col gap-4 px-0 h-[89lvh] overflow-hidden'>
      <div className='relative'>
        <div className='absolute left-4 text-xl tracking-tighter font-semibold flex items-center space-x-2 h-10'>
          <div className='size-4 aspect-square rounded-full bg-blue-400'></div>
          <h3 className='font-bold text-dark-gray dark:text-foreground'>
            {pageTitle[selectedTab as keyof typeof pageTitle]}
          </h3>
        </div>
        <Tabs
          size='lg'
          variant='solid'
          classNames={{
            tabList: 'bg-sidebar mr-5',
            base: 'flex flex-1 justify-end',
          }}
          isVertical={false}
          onSelectionChange={(tab) => setSelectedTab(tab)}
          radius='md'>
          <Tab
            key='products'
            title={
              <div className='flex items-center space-x-1'>
                <span className='tracking-tighter font-semibold'>Products</span>
                <span className='px-2 font-space'>{products?.length}</span>
              </div>
            }>
            <CurrentProducts products={products} />
          </Tab>
          <Tab
            key='create'
            className='p-4'
            title={
              <div className='flex items-center space-x-1'>
                <span className='tracking-tighter font-semibold'>Create</span>
                <Icon name='plus' className='size-4' />
              </div>
            }>
            <ProductForm categories={categories} />
          </Tab>
          <Tab
            key='badges'
            title={
              <div className='flex items-center space-x-1'>
                <span className='tracking-tighter font-semibold'>Badges</span>
                <span className='px-2 font-space'>{4}</span>
              </div>
            }>
            <BadgeList />
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}

export const AllProducts = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  return <CurrentProducts products={products} />
}

const pageTitle = {
  products: 'All Products',
  create: 'New Product',
  badges: 'Badges',
}
