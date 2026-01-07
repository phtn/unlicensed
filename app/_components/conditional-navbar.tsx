'use client'

import {usePathname} from 'next/navigation'

interface ConditionalNavbarProps {
  navbar?: React.ReactNode
}

/**
 * Conditionally renders the navbar based on the current route.
 * Hides navbar for admin routes and the PIN access page (root).
 */
export function ConditionalNavbar({navbar}: ConditionalNavbarProps) {
  const pathname = usePathname()

  // Don't render navbar for admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // Don't render navbar for PIN access page (root)
  if (pathname === '/') {
    return null
  }

  return <>{navbar}</>
}


