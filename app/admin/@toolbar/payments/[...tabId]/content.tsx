'use client'

import {usePathname} from 'next/navigation'
import {ToolbarWrapper} from '../../components'
import {GatewayTab} from './gateway-tab'
import {PaymentsTab} from './payments-tab'

interface ContentProps {
  tabId: string
}

export const Content = ({tabId}: ContentProps) => {
  const pathname = usePathname()

  if (pathname?.includes('/paygate')) {
    return (
      <ToolbarWrapper>
        <GatewayTab
          gateway={'paygate'}
          title={`Gateways`}
          basePath='/admin/payments'
        />
      </ToolbarWrapper>
    )
  }

  if (pathname?.includes('/paylex')) {
    return (
      <ToolbarWrapper>
        <GatewayTab
          gateway='paylex'
          title='Paylex'
          basePath='/admin/payments/paylex'
        />
      </ToolbarWrapper>
    )
  }

  if (pathname?.includes('/rampex')) {
    return (
      <ToolbarWrapper>
        <GatewayTab
          gateway='rampex'
          title='Rampex'
          basePath='/admin/payments/rampex'
        />
      </ToolbarWrapper>
    )
  }

  return (
    <ToolbarWrapper>
      <PaymentsTab />
    </ToolbarWrapper>
  )
}
