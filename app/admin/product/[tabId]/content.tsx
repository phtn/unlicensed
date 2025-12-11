'use client'

import {BadgeList} from '../badges'
import {ProductsContent} from '../content'
import {NewProduct} from '../new-product'

export const Content = ({tabId}: {tabId: string}) => {
  switch (tabId) {
    case 'badges':
      return <BadgeList />
    case 'new':
      return <NewProduct />
    default:
      return <ProductsContent />
  }
}
