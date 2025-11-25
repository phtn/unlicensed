import type {Metadata} from 'next'
import type React from 'react'

export const metadata: Metadata = {
  title: 'Legal Documents',
  description: 'Terms of Use, Privacy Policy, and Purchase Policy',
}

export default function LegalLayout({children}: {children: React.ReactNode}) {
  return <>{children}</>
}
