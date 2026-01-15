'use client'

import {Doc} from '@/convex/_generated/dataModel'
import Link from 'next/link'
import {useMemo} from 'react'
import {HyperList} from '../expermtl/hyper-list'
import ShimmerText from '../expermtl/shimmer'

interface CatergoryListProps {
  categories: Array<Doc<'categories'>> | undefined
}
export const CategoryList = ({categories}: CatergoryListProps) => {
  const data = useMemo(() => {
    // const prefetchFn = (slug: string) => () => router.prefetch(slug)
    return categories
      ?.slice()
      .map((c) => ({name: c.name, slug: c.slug})) as QuickLink[]
  }, [categories])

  return (
    <div className='relative pt-0'>
      <div className="absolute w-full top-0 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
      <HyperList
        direction='right'
        component={CategoryLabel}
        container='gap-0 flex w-screen overflow-scroll md:max-w-7xl bg-background snap-x snap-mandatory'
        itemStyle='snap-start'
        data={data}
      />
    </div>
  )
}

interface QuickLink {
  name: string
  slug: string
}
const CategoryLabel = (item: QuickLink) => {
  return (
    <Link
      href={`/lobby/category/${item.slug}`}
      className='relative flex items-center justify-center'>
      <div className='absolute font-polysans font-semibold text-brand opacity-20 text-4xl scale-105 whitespace-nowrap capitalize'>
        {item.name[0].toUpperCase()}
        {item.name.substring(1, item.name.length)}
      </div>
      <div className='absolute font-polysans font-semibold text-pink-300 text-4xl blur-lg scale-105 whitespace-nowrap capitalize'>
        {item.name[0].toUpperCase()}
        {item.name.substring(1, item.name.length)}
      </div>
      <ShimmerText
        surface='light'
        variant='default'
        className='font-polysans font-semibold text-4xl capitalize whitespace-nowrap w-[calc(100lvw-36px)] md:w-2xs md:mx-auto flex justify-center items-center h-32'
        text={item.name}
      />
    </Link>
  )
}
