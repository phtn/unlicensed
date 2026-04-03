'use client'

import {StoreProduct} from '@/app/types'
import {Icon} from '@/lib/icons'
import {BreadcrumbsItem, Breadcrumbs} from '@/lib/heroui'

interface Props {
  product: StoreProduct
}

export const Crumbs = ({product}: Props) => {
  return (
    <Breadcrumbs
      aria-label='Product breadcrumb'
      className='text-xs sm:text-sm font-brk tracking-tighter'
      itemClasses={{
        item: 'capitalize',
        separator: 'opacity-70',
      }}>
      <BreadcrumbsItem href='/lobby/category' className='group/root'>
        <Icon
          name='t'
          className='size-4 sm:size-4 group-hover/root:opacity-100 dark:group-hover/root:text-white'
        />
      </BreadcrumbsItem>
      <BreadcrumbsItem
        href={`/lobby/category/${product.categorySlug}`}
        className='group/slug underline-offset-4 decoration-dotted decoration-[0.5px]'>
        <span className=' group-hover/slug:bg-brand group-hover/slug:text-white group-hover/slug:opacity-100 rounded-sm px-1.5'>
          {product.categorySlug}
        </span>
      </BreadcrumbsItem>
      <BreadcrumbsItem>{product.name}</BreadcrumbsItem>
    </Breadcrumbs>
  )
}
