'use client'

import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type AccountLayoutProps = {
  children: ReactNode
}

export default function AccountLayout({children}: AccountLayoutProps) {
  return <RouteProtection>{children}</RouteProtection>
}
