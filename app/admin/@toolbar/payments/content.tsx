'use client'

import {PaymentsTab} from './[...tabId]/payments-tab'
import {ToolbarWrapper} from '../components'

export const PaymentsContent = () => {
  return (
    <ToolbarWrapper>
      <PaymentsTab />
    </ToolbarWrapper>
  )
}
