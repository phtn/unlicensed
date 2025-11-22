import {ReactNode} from 'react'
import {AdminSidebar} from './_components/admin-sidebar'
import {OrderDetailsProvider} from './_components/order-details-context'
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
    <SidebarProvider>
      <AdminSidebar />
      <SettingsPanelProvider>
        <OrderDetailsProvider>
          <ProductDetailsProvider>
            <SidebarInset className='group/sidebar-inset'>
              {/*<Navbar />*/}
              <Container>
                <WrappedContent toolbar={toolbar}>{children}</WrappedContent>
                <SettingsPanel />
              </Container>
            </SidebarInset>
          </ProductDetailsProvider>
        </OrderDetailsProvider>
      </SettingsPanelProvider>
    </SidebarProvider>
  )
}

export default AdminLayout
