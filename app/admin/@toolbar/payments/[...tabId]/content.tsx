'use client'

import {ToolbarWrapper} from '../../components'
import {PayGateTab} from './paygate-tab'
import {PaymentsTab} from './payments-tab'
import {usePathname} from 'next/navigation'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  const pathname = usePathname()
  
  // If pathname includes '/paygate', show PayGateTab
  // Otherwise show PaymentsTab (for main /admin/payments route)
  if (pathname?.includes('/paygate')) {
    return (
      <ToolbarWrapper>
        <PayGateTab />
      </ToolbarWrapper>
    )
  }

  return (
    <ToolbarWrapper>
      <PaymentsTab />
    </ToolbarWrapper>
  )
}
