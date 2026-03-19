'use client'

import {hotkeysCoreFeature, syncDataLoaderFeature} from '@headless-tree/core'
import {useTree} from '@headless-tree/react'
import {ItemType, Tree, TreeItem, TreeItemLabel} from './tree'

export const Content = () => {
  const items: Record<string, ItemType> = {
    crm: {name: 'CRM', children: ['leads', 'accounts', 'activities']},
    leads: {name: 'Leads', children: []},
    accounts: {name: 'Accounts', children: []},
    activities: {name: 'Activities', children: []},
  }
  const indent = 20

  const tree = useTree<ItemType>({
    initialState: {
      expandedItems: ['leads', 'accounts', 'activities'],
    },
    indent,
    rootItemId: 'crm',
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId].children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })
  return (
    <main>
      <Tree indent={indent} tree={tree}>
        {tree.getItems().map((item) => (
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel />
          </TreeItem>
        ))}
      </Tree>
    </main>
  )
}
