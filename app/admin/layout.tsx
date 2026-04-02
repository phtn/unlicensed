'use client'

import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {ReactNode} from 'react'
import {OrderDetailsProvider} from './(routes)/ops/orders/order-details-context'
import {AdminAccessGuard} from './_components/admin-access-guard'
import {AdminAlertsListener} from './_components/admin-alerts-listener'
import {AdminSidebar} from './_components/admin-sidebar'
import {ProductDetailsProvider} from './_components/product-details-context'
import {Container, WrappedContent} from './_components/ui/container'
import {SettingsPanel, SettingsPanelProvider} from './_components/ui/settings'
import {SidebarInset, SidebarProvider} from './_components/ui/sidebar'

interface AdminLayoutProps {
  children: ReactNode
  toolbar?: ReactNode
}
const AdminLayout = ({children, toolbar}: AdminLayoutProps) => {
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
                    <WrappedContent toolbar={toolbar}>
                      {children}
                    </WrappedContent>
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

export default AdminLayout
