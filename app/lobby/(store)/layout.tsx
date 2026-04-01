import {type ReactNode} from 'react'
import {MainPage} from './main'
import {StoreSearchParamsAdapter} from './store-search-params-adapter'

type StoreLayoutProps = {
  navbar?: ReactNode
  children?: ReactNode
}

const StoreLayout = ({children, navbar}: StoreLayoutProps) => {
  return (
    <MainPage navbar={navbar}>
      <StoreSearchParamsAdapter>{children}</StoreSearchParamsAdapter>
    </MainPage>
  )
}

export default StoreLayout
