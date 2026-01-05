import {Footer} from '@/components/ui/footer'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'

type StoreLayoutProps = {
  children: ReactNode
  navbar?: React.ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <NuqsAdapter>
      <div className='flex min-h-screen flex-col'>
        {navbar}
        <main className='relative'>{children}</main>
        <div className='h-36 w-full bg-background' />
        <Footer />
      </div>
    </NuqsAdapter>
  )
}

export default StoreLayout
