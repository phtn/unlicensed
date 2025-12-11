'use client'

import {CategoriesContent} from '../content'
import {NewCategory} from '../new-category'

export const Content = ({tabId}: {tabId: string}) => {
  switch (tabId) {
    case 'new':
      return <NewCategory />
    default:
      return <CategoriesContent />
  }
}
