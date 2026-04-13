'use client'

import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'
import {OrderDetailsProvider} from '../(routes)/ops/orders/order-details-context'
import {AdminAccessGuard} from './admin-access-guard'
import {AdminAlertsListener} from './admin-alerts-listener'
import {AdminSidebar} from './admin-sidebar'
import {ProductDetailsProvider} from './product-details-context'
import {Container, WrappedContent} from './ui/container'
import {SettingsPanel, SettingsPanelProvider} from './ui/settings'
import {SidebarInset, SidebarProvider} from './ui/sidebar'

type AdminClientLayoutProps = {
  children: ReactNode
  toolbar?: ReactNode
}

export function AdminClientLayout({children, toolbar}: AdminClientLayoutProps) {
  return (
    <AdminAccessGuard>
      <NuqsAdapter>
        <SidebarProvider>
          <AdminSidebar />
          <SettingsPanelProvider>
            <OrderDetailsProvider>
              <ProductDetailsProvider>
                <SidebarInset className='group/sidebar-inset'>
                  <AdminAlertsListener />
                  <Container>
                    <WrappedContent toolbar={toolbar}>{children}</WrappedContent>
                    <SettingsPanel />
                  </Container>
                </SidebarInset>
              </ProductDetailsProvider>
            </OrderDetailsProvider>
          </SettingsPanelProvider>
        </SidebarProvider>
      </NuqsAdapter>
    </AdminAccessGuard>
  )
}
