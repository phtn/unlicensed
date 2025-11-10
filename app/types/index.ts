import type {HTMLProps} from 'react'
export type ClassName = HTMLProps<HTMLElement>['className']
// export type { LinkItem } from './profile'
export type VoidPromise = () => Promise<void>
export type {StoreCategory, StoreProduct, StoreProductDetail} from './store'
