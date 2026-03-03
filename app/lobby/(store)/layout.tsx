'use client'

import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {Fragment, type ReactNode} from 'react'

type StoreLayoutProps = {
  children: ReactNode
  navbar?: React.ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <NuqsAdapter>
      <div key='store-layout' className='flex min-h-screen flex-col'>
        {navbar != null ? <Fragment key='navbar'>{navbar}</Fragment> : null}
        <main key='main' className='relative flex-1'>
          {children}
        </main>
      </div>
    </NuqsAdapter>
  )
}

export default StoreLayout
