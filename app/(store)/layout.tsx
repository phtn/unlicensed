import {Footer} from '@/components/ui/footer'
import type {ReactNode} from 'react'

type StoreLayoutProps = {
  children: ReactNode
  navbar?: React.ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col overflow-y-auto'>
      {navbar}
      <main className='relative'>{children}</main>
      <div className='h-96 w-full bg-background'></div>
      <Footer />
    </div>
  )
}

export default StoreLayout
