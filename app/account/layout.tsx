import {getFirebaseServerSession} from '@/lib/firebase/server-auth'
import {redirect} from 'next/navigation'
import type {ReactNode} from 'react'
import {AccountClientLayout} from './_components/account-client-layout'

type AccountLayoutProps = {
  children: ReactNode
}

export default async function AccountLayout({children}: AccountLayoutProps) {
  const session = await getFirebaseServerSession()

  if (!session) {
    redirect('/lobby')
  }

  return <AccountClientLayout>{children}</AccountClientLayout>
}
