'use client'

import {ToolbarWrapper} from '../../components'
import {InventoryContent} from '../content'
import {CategoryContent} from './category-tab'
import {ProductContent} from './product-tab'
import {ToolsContent} from './tools-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  switch (tabId[0]) {
    case 'category':
      return (
        <ToolbarWrapper>
          <CategoryContent />
        </ToolbarWrapper>
      )
    case 'product':
      return (
        <ToolbarWrapper>
          <ProductContent />
        </ToolbarWrapper>
      )
    case 'tools':
      return (
        <ToolbarWrapper>
          <ToolsContent />
        </ToolbarWrapper>
      )
    default:
      return <InventoryContent />
  }
}
