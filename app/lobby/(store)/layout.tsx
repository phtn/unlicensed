'use client'

import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {type ReactNode} from 'react'
import {MainPage} from './main'

type StoreLayoutProps = {
  navbar?: ReactNode
  children?: ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <NuqsAdapter>
      <MainPage navbar={navbar}>{children}</MainPage>
    </NuqsAdapter>
  )
}

export default StoreLayout
