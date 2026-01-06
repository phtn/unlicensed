'use client'

import {usePathname} from 'next/navigation'
import {ToolbarWrapper} from '../../components'
import {PayGateTab} from './paygate-tab'
import {PaymentsTab} from './payments-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({}: ContentProps) => {
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
