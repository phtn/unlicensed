'use client'

import dynamic from 'next/dynamic'
import { type ReactNode } from 'react'

const WagmiContext = dynamic(() => import('./index'), {
  ssr: false
})

export function DynamicWagmiContext({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  return <WagmiContext cookies={cookies}>{children}</WagmiContext>
}
