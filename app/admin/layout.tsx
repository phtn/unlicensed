import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {ReactNode} from 'react'
import {OrderDetailsProvider} from './(routes)/ops/orders/order-details-context'
import {AdminSidebarVaul} from './_components/admin-sidebar-vaul'
import {ProductDetailsProvider} from './_components/product-details-context'
import {Container, WrappedContent} from './_components/ui/container'
import {SettingsPanel, SettingsPanelProvider} from './_components/ui/settings'
import {SidebarInset, SidebarProvider} from './_components/ui/sidebar'
import {SidebarProvider as SidebarProviderVaul} from './_components/ui/sidebar-vaul'

interface AdminLayoutProps {
  children: ReactNode
  toolbar?: ReactNode
}
const AdminLayout = ({children, toolbar}: AdminLayoutProps) => {
  return (
    <NuqsAdapter>
      <SidebarProvider>
        <SidebarProviderVaul>
          <AdminSidebarVaul />
          <SettingsPanelProvider>
            <OrderDetailsProvider>
              <ProductDetailsProvider>
                <SidebarInset className='group/sidebar-inset'>
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
        </SidebarProviderVaul>
      </SidebarProvider>
    </NuqsAdapter>
  )
}

export default AdminLayout
