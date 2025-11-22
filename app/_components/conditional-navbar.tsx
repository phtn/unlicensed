'use client'

import {usePathname} from 'next/navigation'

interface ConditionalNavbarProps {
  navbar?: React.ReactNode
}

/**
 * Conditionally renders the navbar based on the current route.
 * Hides navbar for admin routes.
 */
export function ConditionalNavbar({navbar}: ConditionalNavbarProps) {
  const pathname = usePathname()
  
  // Don't render navbar for admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  return <>{navbar}</>
}


