import {Fragment, ReactNode} from 'react'

interface MainPageProps {
  navbar?: ReactNode
  children?: ReactNode
}
export const MainPage = ({navbar, children}: MainPageProps) => {
  return (
    <div key='store-layout' className='flex min-h-screen flex-col'>
      {navbar != null ? <Fragment key='navbar'>{navbar}</Fragment> : null}
      <main key='main' className='relative flex-1'>
        {children}
      </main>
    </div>
  )
}
