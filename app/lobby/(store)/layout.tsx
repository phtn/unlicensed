'use client'

import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'
import {RouteProtection} from '../../_components/route-protection'

type StoreLayoutProps = {
  children: ReactNode
  navbar?: React.ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <RouteProtection>
      <NuqsAdapter>
        <div className='flex min-h-screen flex-col'>
          {navbar}
          <main className='relative flex-1'>{children}</main>
          {/*<Footer />*/}
        </div>
      </NuqsAdapter>
    </RouteProtection>
  )
}

export default StoreLayout
