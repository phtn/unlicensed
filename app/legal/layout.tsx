'use client'

import type React from 'react'
import {RouteProtection} from '../_components/route-protection'

export default function LegalLayout({children}: {children: React.ReactNode}) {
  return <RouteProtection>{children}</RouteProtection>
}
