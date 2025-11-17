import type {ReactNode} from 'react'

type StoreLayoutProps = {
  children: ReactNode
  navbar?: React.ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col overflow-y-auto'>
      {navbar}
      <main className='relative flex-1'>{children}</main>
      <div className='h-96 w-full bg-accent'></div>
    </div>
  )
}

export default StoreLayout
