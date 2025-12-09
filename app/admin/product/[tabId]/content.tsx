'use client'

import {BadgeList} from '../badges'
import {ProductsList} from '../content'
import {NewProduct} from '../new'

export const Content = ({tabId}: {tabId: string}) => {
  switch (tabId) {
    case 'badges':
      return <BadgeList />
    case 'new':
      return <NewProduct />
    default:
      return <ProductsList />
  }
}
