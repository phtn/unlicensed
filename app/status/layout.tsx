'use client'

import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type StatusLayoutProps = {
  children: ReactNode
}

export default function StatusLayout({children}: StatusLayoutProps) {
  return <RouteProtection>{children}</RouteProtection>
}
