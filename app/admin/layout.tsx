import {getFirebaseStaffServerSession} from '@/lib/firebase/server-auth'
import {redirect} from 'next/navigation'
import type {ReactNode} from 'react'
import {AdminClientLayout} from './_components/admin-client-layout'

type AdminLayoutProps = {
  children: ReactNode
  toolbar?: ReactNode
}

export default async function AdminLayout({children, toolbar}: AdminLayoutProps) {
  const session = await getFirebaseStaffServerSession()

  if (!session) {
    redirect('/lobby')
  }

  return <AdminClientLayout toolbar={toolbar}>{children}</AdminClientLayout>
}
