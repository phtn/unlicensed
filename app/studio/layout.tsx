'use client'

import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type StudioLayoutProps = {
  children: ReactNode
}

export default function StudioLayout({children}: StudioLayoutProps) {
  return <RouteProtection>{children}</RouteProtection>
}
