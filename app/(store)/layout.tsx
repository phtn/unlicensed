import type {ReactNode} from 'react'

type StoreLayoutProps = {
  children: ReactNode
}

const StoreLayout = ({children}: StoreLayoutProps) => {
  return (
    <div className='flex min-h-screen flex-col overflow-auto'>
      <main className='relative flex-1'>{children}</main>
      <div className='h-96 w-full bg-accent'></div>
    </div>
  )
}

export default StoreLayout
