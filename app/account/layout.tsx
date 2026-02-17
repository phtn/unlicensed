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
        <div className='max-w-7xl mx-auto mt-12 lg:mt-16 xl:mt-20 2xl:mt-24 h-[calc(100lvh)] overflow-y-auto'>
          {children}
        </div>
      </div>
    </RouteProtection>
  )
}
