'use client'

import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type StudioLayoutProps = {
  children: ReactNode
}

export default function StudioLayout({children}: StudioLayoutProps) {
  return (
    <RouteProtection>
      <NuqsAdapter>{children}</NuqsAdapter>
    </RouteProtection>
  )
}
