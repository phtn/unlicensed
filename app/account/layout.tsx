'use client'

import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type AccountLayoutProps = {
  children: ReactNode
}

export default function AccountLayout({children}: AccountLayoutProps) {
  return (
    <RouteProtection>
      <div className='min-h-screen bg-white dark:bg-background overflow-hidden'>
        <div className='max-w-7xl mx-auto my-10 sm:my-12 md:my-12 lg:my-16 xl:my-20 2xl:my-24 h-[calc(100lvh-144px)] overflow-y-auto'>
          {children}
        </div>
      </div>
    </RouteProtection>
  )
}
