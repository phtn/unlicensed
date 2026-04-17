'use client'

import {Tabs} from '@base-ui/react'
import type {ReactNode} from 'react'
import {ScrollArea} from '../../ui/scroll-area'
import type {MasterTabValue} from './types'

interface PanelContainerProps {
  children: ReactNode
  tabValue: MasterTabValue
}

export const PanelContainer = ({children, tabValue}: PanelContainerProps) => {
  return (
    <Tabs.Panel value={tabValue} className='h-full outline-none'>
      <ScrollArea className='h-128'>{children}</ScrollArea>
    </Tabs.Panel>
  )
}
