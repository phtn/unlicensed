'use client'

import {StoreProduct} from '@/app/types'
import {Icon} from '@/lib/icons'
import {Breadcrumbs, BreadcrumbsItem} from '@heroui/react'

interface Props {
  product: StoreProduct
}

export const Crumbs = ({product}: Props) => {
  return (
    <Breadcrumbs
      aria-label='Product breadcrumb'
      className='text-xs sm:text-sm font-ios tracking-tighter text-foreground separator:text-foreground'>
      <BreadcrumbsItem href='/lobby/category' className='group/root'>
        <Icon
          name='t'
          className='size-4 sm:size-4 text-foreground/50 group-hover/root:opacity-100 dark:group-hover/root:text-white'
        />
      </BreadcrumbsItem>
      <BreadcrumbsItem
        href={`/lobby/category/${product.categorySlug}`}
        className='group/slug text-foreground/50 '>
        <span className='text-foreground/70 group-hover/slug:bg-brand group-hover/slug:text-white group-hover/slug:opacity-100 rounded-sm px-1.5 decoration-0'>
          {product.categorySlug}
        </span>
      </BreadcrumbsItem>
      <BreadcrumbsItem>{product.name}</BreadcrumbsItem>
    </Breadcrumbs>
  )
}
